import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import Document from '../models/Document.js';

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
 * @desc    Upload, parse, and index a university document into MongoDB & Azure AI Search
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

    // 1. Extract text from file (PDF, DOCX, TXT)
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

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract meaningful text from the uploaded document.'
      });
    }

    // 2. Chunk the extracted text
    const chunks = chunkText(extractedText);
    const docId = `doc-${Date.now()}`;
    let azureIndexed = false;
    let indexedChunks = 0;

    // 3. Optional: upload to Azure AI Search if configured
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
          uploadedBy: req.user ? req.user.email : 'System Admin',
          uploadedAt: new Date().toISOString()
        }));

        for (let i = 0; i < documents.length; i += 100) {
          await client.uploadDocuments(documents.slice(i, i + 100));
          indexedChunks += Math.min(100, documents.length - i);
        }
        azureIndexed = true;
      } catch (azureErr) {
        console.warn('[RAG] Azure AI Search indexing skipped/failed:', azureErr.message);
      }
    } else {
      indexedChunks = chunks.length;
    }

    // 4. Save to MongoDB collection `Document`
    const formattedChunks = chunks.map((chunk, idx) => ({
      chunkId: `${docId}-chunk-${idx}`,
      chunkIndex: idx,
      content: chunk
    }));

    const savedDoc = await Document.create({
      docId,
      title: docTitle,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      category,
      uploadedBy: req.user ? req.user.email : 'Faculty/Admin',
      totalChunks: chunks.length,
      indexedChunks,
      chunks: formattedChunks,
      azureIndexed
    });

    res.status(201).json({
      success: true,
      message: `Document "${docTitle}" uploaded, processed, and stored in MongoDB successfully.`,
      document: {
        id: savedDoc._id,
        docId: savedDoc.docId,
        title: savedDoc.title,
        originalName: savedDoc.originalName,
        category: savedDoc.category,
        sizeBytes: savedDoc.sizeBytes,
        totalChunks: savedDoc.totalChunks,
        indexedChunks: savedDoc.indexedChunks,
        uploadedAt: savedDoc.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all uploaded/indexed documents from MongoDB
 * @route   GET /api/v1/rag/documents
 * @access  Authenticated users
 */
export const listDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find()
      .select('-chunks')
      .sort({ createdAt: -1 });

    const formatted = docs.map((d) => ({
      id: d._id,
      docId: d.docId,
      title: d.title,
      originalName: d.originalName,
      category: d.category,
      sizeBytes: d.sizeBytes,
      uploadedBy: d.uploadedBy,
      uploadedAt: d.createdAt,
      totalChunks: d.totalChunks,
      azureIndexed: d.azureIndexed
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      documents: formatted,
      azureConfigured:
        !!(process.env.AZURE_SEARCH_ENDPOINT && !process.env.AZURE_SEARCH_ENDPOINT.includes('your-'))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single document details with chunk preview
 * @route   GET /api/v1/rag/documents/:id
 * @access  Authenticated users
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { docId: id };
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: id }, { docId: id }] };
    }

    const doc = await Document.findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.status(200).json({
      success: true,
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a document from MongoDB (and Azure Search if configured)
 * @route   DELETE /api/v1/rag/documents/:id
 * @access  Faculty, Admin
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { docId: id };
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: id }, { docId: id }] };
    }

    const doc = await Document.findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found in database.' });
    }

    // Try deleting from Azure AI Search if configured
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
        const idsToDelete = Array.from({ length: doc.totalChunks }, (_, i) => ({
          id: `${doc.docId}-chunk-${i}`
        }));
        if (idsToDelete.length > 0) {
          await client.deleteDocuments(idsToDelete);
        }
      } catch (azureErr) {
        console.warn('[RAG] Azure delete skipped/failed:', azureErr.message);
      }
    }

    await Document.deleteOne({ _id: doc._id });

    res.status(200).json({ success: true, message: `Document "${doc.title}" deleted successfully from MongoDB.` });
  } catch (error) {
    next(error);
  }
};
