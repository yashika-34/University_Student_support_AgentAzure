import { sendEmailNotification } from '../services/emailService.js';

/**
 * Campus Services Controller: Faculty Booking, Support Tickets, Scholarships, Campus Events
 */

/**
 * Appointments: Get & Book
 */
export const getAppointments = async (req, res) => {
  try {
    const mockAppointments = [
      {
        id: 'apt-101',
        facultyName: 'Dr. Alan Turing',
        courseCode: 'CS-301 (Algorithms)',
        appointmentDate: '2026-10-02',
        timeSlot: '14:30 - 15:00',
        purpose: 'Review Dynamic Programming assignment rubric and grade clarification',
        status: 'confirmed',
        location: 'Turing Hall, Room 302 / Microsoft Teams'
      },
      {
        id: 'apt-102',
        facultyName: 'Dr. Grace Hopper',
        courseCode: 'CS-305 (Cloud Computing)',
        appointmentDate: '2026-10-05',
        timeSlot: '11:00 - 11:30',
        purpose: 'Attendance deficit counseling & medical leave waiver documentation',
        status: 'pending',
        location: 'Hopper Pavilion, Cabin 401'
      }
    ];

    res.status(200).json({ success: true, data: mockAppointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { facultyName, courseCode, appointmentDate, timeSlot, purpose } = req.body;

    const newAppointment = {
      id: `apt-${Date.now().toString().slice(-4)}`,
      facultyName: facultyName || 'Dr. Alan Turing',
      courseCode: courseCode || 'CS-301',
      appointmentDate: appointmentDate || new Date().toISOString().split('T')[0],
      timeSlot: timeSlot || '14:00 - 14:30',
      purpose: purpose || 'Academic Guidance',
      status: 'confirmed',
      location: 'Turing Hall, Room 302'
    };

    // Send email confirmation
    await sendEmailNotification({
      to: 'student@university.edu',
      subject: `Faculty Appointment Confirmed: ${newAppointment.facultyName}`,
      templateType: 'appointment_confirmation',
      data: {
        studentName: 'Alex Mercer',
        facultyName: newAppointment.facultyName,
        appointmentDate: newAppointment.appointmentDate,
        timeSlot: newAppointment.timeSlot,
        location: newAppointment.location,
        purpose: newAppointment.purpose
      }
    });

    res.status(201).json({ success: true, data: newAppointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Support Tickets: Get & Create
 */
export const getTickets = async (req, res) => {
  try {
    const mockTickets = [
      {
        ticketId: 'TICK-482910',
        subject: 'Attendance Discrepancy for Lab Session 4 (CS-305)',
        category: 'Attendance Query',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Prof. Registrar Office',
        createdAt: '2026-09-18T10:15:00.000Z',
        messages: [
          { senderRole: 'student', senderName: 'Alex Mercer', message: 'I was present in the lab on Sept 14th but marked absent on portal.', sentAt: '2026-09-18T10:15:00.000Z' },
          { senderRole: 'staff', senderName: 'Academic Officer', message: 'Verifying physical sign-in sheet with TA. Will update within 24h.', sentAt: '2026-09-19T09:00:00.000Z' }
        ]
      },
      {
        ticketId: 'TICK-338219',
        subject: 'Fall Semester Fee Receipt & Scholarship Adjustment',
        category: 'Fees & Bursar',
        priority: 'Medium',
        status: 'Resolved',
        assignedTo: 'Bursar Financial Services',
        createdAt: '2026-09-12T14:30:00.000Z',
        messages: [
          { senderRole: 'student', senderName: 'Alex Mercer', message: 'Requested updated invoice reflecting merit scholarship waiver.', sentAt: '2026-09-12T14:30:00.000Z' },
          { senderRole: 'staff', senderName: 'Finance Admin', message: 'Updated receipt generated. Deduction applied in student billing portal.', sentAt: '2026-09-13T11:20:00.000Z' }
        ]
      }
    ];

    res.status(200).json({ success: true, data: mockTickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, message } = req.body;

    const newTicket = {
      ticketId: `TICK-${Math.floor(100000 + Math.random() * 900000)}`,
      subject,
      category: category || 'Academic Advisory',
      priority: priority || 'Medium',
      status: 'Open',
      assignedTo: 'Campus Helpdesk Support',
      createdAt: new Date().toISOString(),
      messages: [
        {
          senderRole: 'student',
          senderName: 'Alex Mercer',
          message: message || 'Inquiry submitted',
          sentAt: new Date().toISOString()
        }
      ]
    };

    res.status(201).json({ success: true, data: newTicket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Scholarship Recommendations
 */
export const getScholarships = async (req, res) => {
  try {
    const scholarships = [
      {
        id: 'sch-1',
        title: 'Presidential Academic Excellence Merit Fellowship',
        provider: 'University Board of Regents',
        amount: '$5,000 / semester',
        minCgpa: 3.75,
        maxIncome: 150000,
        eligibleDepartments: ['All Departments'],
        deadline: '2026-10-31',
        isEligible: true,
        matchScore: '98% Match',
        description: 'Awarded to top 5% GPA students maintaining exceptional academic and research standing.'
      },
      {
        id: 'sch-2',
        title: 'Women in Technology & AI Innovation Grant',
        provider: 'Azure Global STEM Foundation',
        amount: '$3,500 / year',
        minCgpa: 3.4,
        maxIncome: 120000,
        eligibleDepartments: ['Computer Science', 'Data Science', 'Electrical'],
        deadline: '2026-11-15',
        isEligible: true,
        matchScore: '92% Match',
        description: 'Empowers underrepresented student researchers in machine learning, cloud computing, and cybersecurity.'
      },
      {
        id: 'sch-3',
        title: 'Need-Based Tuition Assistance Bursary',
        provider: 'Student Financial Aid Office',
        amount: 'Up to 50% Tuition Waiver',
        minCgpa: 2.8,
        maxIncome: 65000,
        eligibleDepartments: ['All Departments'],
        deadline: '2026-10-25',
        isEligible: false,
        matchScore: 'Income Verified Criteria',
        description: 'Comprehensive financial support covering course credits and laboratory charges for eligible domestic students.'
      }
    ];

    res.status(200).json({ success: true, data: scholarships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Campus Events: Get & RSVP
 */
export const getCampusEvents = async (req, res) => {
  try {
    const events = [
      {
        id: 'ev-1',
        title: 'HackUni 2026: 36-Hour Generative AI Hackathon',
        category: 'Hackathon',
        eventDate: '2026-10-18T09:00:00.000Z',
        venue: 'Student Innovation Center & Azure Cloud Lab',
        organizer: 'ACM Student Chapter & Google Developer Student Club',
        capacity: 250,
        registeredCount: 184,
        badgeAwarded: 'Hackathon Contender',
        isRegistered: true,
        description: 'Compete with 50+ multidisciplinary teams building AI solutions on Azure AI Foundry and Kubernetes.'
      },
      {
        id: 'ev-2',
        title: 'Industry Keynote: The Future of Distributed Systems',
        category: 'Guest Lecture',
        eventDate: '2026-10-22T15:00:00.000Z',
        venue: 'University Grand Auditorium',
        organizer: 'Department of Computer Science',
        capacity: 400,
        registeredCount: 290,
        badgeAwarded: 'Tech Enthusiast',
        isRegistered: false,
        description: 'Distinguished lecture by leading cloud architects from Microsoft and open Q&A on scalable microservices.'
      },
      {
        id: 'ev-3',
        title: 'Fall Career Fair: 40+ Tech & Finance Recruiters',
        category: 'Career Fair',
        eventDate: '2026-11-04T10:00:00.000Z',
        venue: 'Campus Recreation Pavilion',
        organizer: 'University Career & Placement Cell',
        capacity: 1000,
        registeredCount: 650,
        badgeAwarded: 'Career Ready',
        isRegistered: true,
        description: 'Bring verified resumes and portfolio QR codes to meet engineering hiring teams directly.'
      }
    ];

    res.status(200).json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rsvpEvent = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      message: 'RSVP confirmed. Digital badge allocated and synced to university calendar.',
      eventId: id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
