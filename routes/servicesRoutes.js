import express from 'express';
import {
  getAppointments,
  createAppointment,
  getTickets,
  createTicket,
  getScholarships,
  getCampusEvents,
  rsvpEvent
} from '../controllers/servicesController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / open views for campus information
router.get('/scholarships', getScholarships);
router.get('/events', getCampusEvents);

// Authenticated service routes
router.use(verifyToken);

router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);

router.post('/events/:id/rsvp', rsvpEvent);

export default router;
