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

const router = express.Router();

router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);

router.get('/scholarships', getScholarships);

router.get('/events', getCampusEvents);
router.post('/events/:id/rsvp', rsvpEvent);

export default router;
