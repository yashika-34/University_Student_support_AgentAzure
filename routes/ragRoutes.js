import express from 'express';
import multer from 'multer';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument
} from '../controllers/ragController.js';

const router = express.Router();

// Multer config: store files in memory buffer for processing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, and TXT files are supported.'), false);
    }
  }
});

// All RAG routes require authentication
router.use(verifyToken);

// GET /api/v1/rag/documents — List all indexed documents (accessible to students & faculty)
router.get('/documents', listDocuments);

// GET /api/v1/rag/documents/:id — Single document preview & details
router.get('/documents/:id', getDocumentById);

// GET /api/v1/rag/documents/:id/download — Download document text content
router.get('/documents/:id/download', downloadDocument);

// POST /api/v1/rag/upload — Upload and index a university document
router.post(
  '/upload',
  authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'),
  upload.single('document'),
  uploadDocument
);

// DELETE /api/v1/rag/documents/:id — Remove a document from the index
router.delete(
  '/documents/:id',
  authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'),
  deleteDocument
);

export default router;
