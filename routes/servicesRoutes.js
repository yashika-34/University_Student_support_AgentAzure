import express from 'express';
import {
  getAppointments,
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAvailableFaculty,
  getTickets,
  createTicket,
  getScholarships,
  applyScholarship,
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

// Faculty directory for appointment booking
router.get('/faculty', getAvailableFaculty);

// Appointments
router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.put('/appointments/:id/reschedule', rescheduleAppointment);
router.delete('/appointments/:id', cancelAppointment);

// Tickets
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);

// Scholarships
router.post('/scholarships/:id/apply', applyScholarship);

// Events
router.post('/events/:id/rsvp', rsvpEvent);

export default router;

