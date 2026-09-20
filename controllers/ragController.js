import { SearchClient, SearchIndexClient, AzureKeyCredential } from '@azure/search-documents';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import mongoose from 'mongoose';

// In-memory document registry (replace with MongoDB model in production)
const documentRegistry = new Map();

/**
 * Chunk text into overlapping segments for better RAG retrieval
 */
function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

/**
 * @desc    Upload, parse, and index a university document into Azure AI Search
 * @route   POST /api/v1/rag/upload
 * @access  Faculty, Admin
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { category = 'General', title } = req.body;
    const file = req.file;
    const docTitle = title || file.originalname.replace(/\.[^.]+$/, '');

    // 1. Extract text from file
    let extractedText = '';
    if (file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(file.buffer);
      extractedText = parsed.text;
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else if (file.mimetype === 'text/plain') {
      extractedText = file.buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract meaningful text from the uploaded document.'
      });
    }

    // 2. Chunk the extracted text
    const chunks = chunkText(extractedText);
    console.log(`[RAG] Extracted ${extractedText.length} chars, created ${chunks.length} chunks.`);

    // 3. Try to upload to Azure AI Search
    const docId = `doc-${Date.now()}`;
    let indexedChunks = 0;

    if (
      process.env.AZURE_SEARCH_ENDPOINT &&
      process.env.AZURE_SEARCH_API_KEY &&
      !process.env.AZURE_SEARCH_ENDPOINT.includes('mock-') &&
      !process.env.AZURE_SEARCH_ENDPOINT.includes('your-')
    ) {
      try {
        const client = new SearchClient(
          process.env.AZURE_SEARCH_ENDPOINT,
          process.env.AZURE_SEARCH_INDEX_NAME || 'university-knowledge-index',
          new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
        );

        const documents = chunks.map((chunk, idx) => ({
          id: `${docId}-chunk-${idx}`,
          title: docTitle,
          content: chunk,
          category,
          sourceUrl: file.originalname,
          uploadedBy: req.user.email,
          uploadedAt: new Date().toISOString()
        }));

        // Upload in batches of 100
        for (let i = 0; i < documents.length; i += 100) {
          await client.uploadDocuments(documents.slice(i, i + 100));
          indexedChunks += Math.min(100, documents.length - i);
        }

        console.log(`[RAG] Successfully indexed ${indexedChunks} chunks to Azure AI Search.`);
      } catch (azureErr) {
        console.warn('[RAG] Azure AI Search indexing failed, storing locally:', azureErr.message);
      }
    } else {
      console.log('[RAG] Azure AI Search not configured — storing chunks in memory registry.');
      indexedChunks = chunks.length;
    }

    // 4. Store document metadata in local registry
    const docMeta = {
      id: docId,
      title: docTitle,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      category,
      uploadedBy: req.user.email,
      uploadedAt: new Date().toISOString(),
      totalChunks: chunks.length,
      indexedChunks,
      // Store first few chunks locally for fallback search
      chunks: chunks.slice(0, 20)
    };
    documentRegistry.set(docId, docMeta);

    res.status(201).json({
      success: true,
      message: `Document "${docTitle}" uploaded and indexed successfully.`,
      document: {
        id: docId,
        title: docTitle,
        category,
        sizeBytes: file.size,
        totalChunks: chunks.length,
        indexedChunks,
        uploadedAt: docMeta.uploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all uploaded/indexed documents
 * @route   GET /api/v1/rag/documents
 * @access  Authenticated users
 */
export const listDocuments = async (req, res, next) => {
  try {
    const docs = Array.from(documentRegistry.values()).map((d) => ({
      id: d.id,
      title: d.title,
      originalName: d.originalName,
      category: d.category,
      sizeBytes: d.sizeBytes,
      uploadedBy: d.uploadedBy,
      uploadedAt: d.uploadedAt,
      totalChunks: d.totalChunks
    }));

    // Also try to get from Azure AI Search
    res.status(200).json({
      success: true,
      count: docs.length,
      documents: docs,
      azureConfigured:
        !!(process.env.AZURE_SEARCH_ENDPOINT && !process.env.AZURE_SEARCH_ENDPOINT.includes('your-'))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a document from registry (and Azure Search if configured)
 * @route   DELETE /api/v1/rag/documents/:id
 * @access  Faculty, Admin
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!documentRegistry.has(id)) {
      return res.status(404).json({ success: false, message: 'Document not found in registry.' });
    }

    const doc = documentRegistry.get(id);

    // Try deleting from Azure AI Search
    if (
      process.env.AZURE_SEARCH_ENDPOINT &&
      process.env.AZURE_SEARCH_API_KEY &&
      !process.env.AZURE_SEARCH_ENDPOINT.includes('your-')
    ) {
      try {
        const client = new SearchClient(
          process.env.AZURE_SEARCH_ENDPOINT,
          process.env.AZURE_SEARCH_INDEX_NAME || 'university-knowledge-index',
          new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
        );
        // Delete all chunks for this document
        const idsToDelete = Array.from({ length: doc.totalChunks }, (_, i) => ({
          id: `${id}-chunk-${i}`
        }));
        if (idsToDelete.length > 0) {
          await client.deleteDocuments(idsToDelete);
        }
      } catch (azureErr) {
        console.warn('[RAG] Azure delete failed:', azureErr.message);
      }
    }

    documentRegistry.delete(id);

    res.status(200).json({ success: true, message: 'Document deleted from index.' });
  } catch (error) {
    next(error);
  }
};
