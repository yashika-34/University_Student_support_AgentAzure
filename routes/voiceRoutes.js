import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { textToSpeech, speechToText } from '../controllers/voiceController.js';

const router = express.Router();

router.use(verifyToken);

// POST /api/v1/voice/tts — Convert text to speech audio (returns base64 audio)
router.post('/tts', textToSpeech);

// POST /api/v1/voice/stt — Convert speech audio blob to text transcript
router.post('/stt', speechToText);

export default router;
