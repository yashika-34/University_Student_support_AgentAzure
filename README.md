# UniAssist AI — University Student Support Agent
### Enterprise MERN Stack & Azure AI Foundry Solution

UniAssist AI is a modern 24/7 student support system designed for universities. It combines the MERN stack with Azure AI Foundry (Azure OpenAI & Azure AI Search) to answer student queries, track attendance, forecast class requirements, manage assignment deadlines, and automate administrative workflows.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js 20+ LTS](https://nodejs.org/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB instance running on port 27017

---

### 1. Backend Setup (Node.js & Express)

```bash
# 1. Install Backend Dependencies
npm install

# 2. Configure Environment
# The repository includes a ready-to-use .env file.
# You can update MONGODB_URI and Azure AI Foundry keys as needed.

# 3. Seed Database with Default Accounts & University Records
npm run seed

# 4. Start Backend Server
npm run dev
# Server will run on port 5000
```

#### Default Test Accounts Seeded:
| Persona | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Student** | `alex.student@university.edu` | `Password123!` | `student` |
| **Faculty** | `dr.alan@university.edu` | `Password123!` | `faculty` |
| **Administrator** | `admin@university.edu` | `Password123!` | `admin` |

---

### 2. Frontend Setup (React 18 & Vite)

```bash
# 1. Navigate to Client Directory
cd client

# 2. Install Frontend Dependencies
npm install

# 3. Build Client for Production Single-Service Serving
npm run build

# Or run Vite dev server locally:
npm run dev
```

---

## 📁 Repository Structure

```
├── client/                          # React 18 SPA Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/              # Navbar, ProtectedRoute
│   │   ├── context/                 # AuthContext (JWT & Demo Switcher)
│   │   ├── pages/                   # 10 Responsive Application Pages
│   │   │   ├── Home.jsx             # Landing Page & Quick Query Bar
│   │   │   ├── Login.jsx            # Sign In & Quick Demo Fill
│   │   │   ├── Register.jsx         # Role-Aware Account Creation
│   │   │   ├── StudentDashboard.jsx # Academic Metrics, Gauge & Shortcuts
│   │   │   ├── FacultyDashboard.jsx # Course Rosters & Intervention Alerts
│   │   │   ├── AttendancePage.jsx   # Attendance Tracker & Bunk Simulator
│   │   │   ├── AssignmentPage.jsx   # Deliverables, Countdown & Upload Modal
│   │   │   ├── FaqPage.jsx          # Instant Searchable Accordion FAQs
│   │   │   ├── AiChatbotPage.jsx    # Azure AI Agent RAG Chat & Escalation
│   │   │   └── ProfilePage.jsx      # User Profile, Advisor & Emergency
│   │   ├── services/api.js          # Axios Client & Fallback Mock Data
│   │   ├── App.jsx                  # React Router Configuration
│   │   ├── index.css                # Ultra-Modern Dark Glassmorphic Theme
│   │   └── main.jsx                 # React DOM Root
│   ├── index.html                   # HTML5 Entry with Outfit & Inter Fonts
│   ├── package.json                 # Frontend Dependencies
│   └── vite.config.js               # Proxy to port 5000
│
├── config/                          # Database connection (config/db.js)
├── controllers/                     # MVC Business Logic Controllers
│   ├── authController.js
│   ├── studentController.js
│   ├── courseController.js
│   ├── attendanceController.js
│   ├── assignmentController.js
│   ├── faqController.js
│   ├── chatController.js
│   └── notificationController.js
├── middleware/                      # Auth, RBAC, and Error Handlers
├── models/                          # 9 Mongoose Schemas & Barrel Export
│   ├── User.js
│   ├── Student.js
│   ├── Faculty.js
│   ├── Course.js
│   ├── Attendance.js
│   ├── Assignment.js
│   ├── Notification.js
│   ├── FAQ.js
│   ├── ChatHistory.js
│   └── index.js
├── routes/                          # Express REST API Route Definitions
├── utils/                           # Database Seeder (seedData.js)
├── .env                             # Environment Variables
├── package.json                     # Backend Dependencies
├── server.js                        # Express Server Entry Point
├── DATABASE_SCHEMA.md               # Complete Data Dictionary & ER Diagrams
├── PROJECT_PLAN.md                  # Comprehensive Project Plan
└── SYSTEM_ARCHITECTURE.md           # End-to-End System Architecture (ASCII)
```

---

## 🤖 Azure AI Foundry Integration Capabilities
- **Zero-Hallucination Grounding:** Uses Hybrid Semantic Search (Azure AI Search) over verified academic guidelines.
- **Autonomous Tool Execution:** Executes function calls into MongoDB for real-time student attendance, upcoming assignment deadlines, and personalized exam schedules.
- **Azure AI Content Safety:** Automatic prompt injection defense and toxic content interceptor.
- **Human Ticket Escalation:** Converts unresolvable queries into support tickets assigned to staff.
"# University_Student_support_AgentAzure" 
