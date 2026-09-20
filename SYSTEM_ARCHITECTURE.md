# University Student Support Agent (UniAssist AI)
## Comprehensive Technical Architecture Specification

This document details the complete end-to-end technical architecture for the **University Student Support Agent (UniAssist AI)**, built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) and integrated with **Azure AI Foundry**.

---

## Table of Contents
1. [High-Level System Overview](#1-high-level-system-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Collections & Data Modeling](#4-database-collections--data-modeling)
5. [Complete REST API Structure](#5-complete-rest-api-structure)
6. [Authentication & Authorization Flow](#6-authentication--authorization-flow)
7. [AI Integration & RAG Orchestration Flow](#7-ai-integration--rag-orchestration-flow)
8. [Production Deployment Architecture](#8-production-deployment-architecture)

---

## 1. High-Level System Overview

UniAssist AI unifies three primary user personas (**Students**, **Faculty**, and **University Administrators**) into a single, responsive web portal powered by a modular Node.js API and an enterprise AI reasoning engine hosted on Azure AI Foundry.

### 1.1 High-Level Architecture Diagram (ASCII)

```
+===================================================================================================+
|                                    PRESENTATION TIER (CLIENT)                                     |
|  +---------------------------------------------------------------------------------------------+  |
|  |                             React 18 Single Page Application (SPA)                          |  |
|  |  +------------------------+  +------------------------+  +-------------------------------+  |  |
|  |  |     Student Portal     |  |     Faculty Portal     |  |     Administrator Console     |  |  |
|  |  |  - Conversational Bot  |  |  - Attendance Marking  |  |  - Document Ingestion (RAG)   |  |  |
|  |  |  - Attendance Tracker  |  |  - Assignment Manager  |  |  - User Provisioning (RBAC)   |  |  |
|  |  |  - Exam Schedule View  |  |  - Syllabus Uploader   |  |  - Ticket Resolution Desk     |  |  |
|  |  |  - Fee & Ledger Cards  |  |  - Ticket Response Desk|  |  - Analytics & Audit Logs      |  |  |
|  |  +------------------------+  +------------------------+  +-------------------------------+  |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  |  | Core Client State: Zustand Store | TanStack Query Cache | Axios Interceptor (JWT)     |  |  |
|  |  | Real-Time Communication: EventSource (SSE for AI stream) / Socket.io Client (Tickets) |  |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
+==============================================+====================================================+
                                               |
                                               | HTTPS (TLS 1.3) / WSS
                                               v
+===================================================================================================+
|                                APPLICATION & API GATEWAY TIER                                     |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                  Node.js 20 LTS / Express.js                                |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  |  | Middleware Pipeline: Helmet | CORS | Rate Limiter | Request Logger (Morgan)           |  |  |
|  |  | Security: JWT Verification | Role-Based Access Control (RBAC Guard)                   |  |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  | Academic Service   |  | Student Service    |  | Finance Service    |  | Support & FAQ  |  |  |
|  |  | - Courses & Timetable- Attendance Engine   |  | - Fee Ledger       |  | - Escalation   |  |  |
|  |  | - Exam Schedules   |  | - Gradebook        |  | - Payment Status   |  | - Directory    |  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  |  |                           AI Agent Orchestrator & Tool Registry                       |  |  |
|  |  |  - Context Builder (Chat History + User Claims)                                        |  |  |
|  |  |  - Function Calling Dispatcher (Queries MongoDB for live attendance/exam/fee data)  |  |  |
|  |  |  - Stream Transformer (SSE push to client)                                            |  |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------+  |
+===================+======================================================+========================+
                    |                                                      |
                    | Mongoose ODM (Queries & Updates)                     | Azure SDK for JS / HTTPS
                    v                                                      v
+=========================================+  +======================================================+
|          DATA PERSISTENCE TIER          |  |               AZURE AI FOUNDRY PLATFORM              |
|  +-----------------------------------+  |  |  +------------------------------------------------+  |
|  |           MongoDB Atlas           |  |  |  |        Azure AI Content Safety Guardrails      |  |
|  |  - users / roles                  |  |  |  |  - Prompt Injection Defense                    |  |
|  |  - courses / enrollments          |  |  |  |  - Hate / Toxicity / Self-Harm Screening       |  |
|  |  - attendance_records             |  |  |  +-----------------------+------------------------+  |
|  |  - exam_schedules                 |  |  |                          |                          |
|  |  - assignments / submissions      |  |  |  +-----------------------v------------------------+  |
|  |  - fee_accounts / transactions    |  |  |  |           Azure OpenAI Models Deployment       |  |
|  |  - campus_services                |  |  |  |  - GPT-4o-mini: Fast routing & tool calling     |  |
|  |  - faq_items / documents          |  |  |  |  - GPT-4o: Complex reasoning & synthesis        |  |
|  |  - chat_sessions / messages       |  |  |  +-----------------------+------------------------+  |
|  |  - support_tickets                |  |  |                          ^                          |
|  +-----------------------------------+  |  |                          | Grounding / Retrieval    |
|  +-----------------------------------+  |  |  +-----------------------v------------------------+  |
|  |         Redis Cache Layer         |  |  |  |          Azure AI Search (Hybrid RAG)          |  |
|  |  - Session state / User caching   |  |  |  |  - Vector Search (text-embedding-3-large)      |  |
|  |  - Course catalog cache           |  |  |  |  - Full-Text Keyword & Semantic Reranker       |  |
|  |  - Rate-limit counters            |  |  |  +-----------------------+------------------------+  |
|  +-----------------------------------+  |  |                          | Index Document Ingestion |
|                                         |  |  +-----------------------v------------------------+  |
|                                         |  |  |               Azure Blob Storage               |  |
|                                         |  |  |  - Official Syllabi, Handbooks, Fee Guidelines |  |
|                                         |  |  +------------------------------------------------+  |
|                                         |  +------------------------------------------------------+
+=========================================+=========================================================+
```

---

## 2. Frontend Architecture

The frontend is a decoupled Single Page Application (SPA) designed with a component-driven architecture, modular state management, and real-time streaming interfaces.

### 2.1 Component Hierarchy & Tree Diagram (ASCII)

```
[App Root: main.jsx]
  |
  +-- [App Providers: ThemeProvider, AuthProvider, QueryClientProvider]
  |
  +-- [Router: BrowserRouter / AppRoutes]
        |
        +-- Public Routes
        |     +-- /login  --> [LoginPage]
        |     +-- /forgot-password --> [ForgotPasswordPage]
        |     +-- /unauthorized --> [UnauthorizedPage]
        |
        +-- Protected Routes (Wrapped in <ProtectedRoute allowedRoles={[...]} />)
              |
              +-- [AppLayout (Navbar, Sidebar, Breadcrumbs, NotificationCenter)]
                    |
                    +-- Student Views:
                    |     +-- /student/dashboard    --> [StudentDashboardPage]
                    |     |     +-- [GreetingCard]
                    |     |     +-- [AttendanceSummaryWidget]
                    |     |     +-- [UpcomingDeadlinesWidget]
                    |     |     +-- [NextExamCountdownWidget]
                    |     |     +-- [QuickQuerySuggestions]
                    |     +-- /student/assistant    --> [AIAssistantPage]
                    |     |     +-- [SessionSidebar (Chat History)]
                    |     |     +-- [ChatWindow]
                    |     |     |     +-- [MessageList]
                    |     |     |     |     +-- [UserBubble]
                    |     |     |     |     +-- [AgentBubble (Streaming Markdown, MathJax, Tables)]
                    |     |     |     |     +-- [ActionCard (e.g., Pay Fee, View Room)]
                    |     |     |     +-- [PromptInputBar (Voice input, Suggested chips)]
                    |     +-- /student/courses      --> [CourseCatalogPage]
                    |     +-- /student/attendance   --> [DetailedAttendancePage (Calculator & Alerts)]
                    |     +-- /student/exams        --> [ExamSchedulePage (Digital Hall Ticket & .ics)]
                    |     +-- /student/assignments  --> [AssignmentTrackerPage]
                    |     +-- /student/fees         --> [FeeLedgerPage (Invoices & Balance Breakdown)]
                    |     +-- /student/services     --> [CampusDirectoryPage (Map & Hours)]
                    |     +-- /student/faqs         --> [FAQSearchPage (Semantic Lookup)]
                    |     +-- /student/tickets      --> [StudentTicketHistoryPage]
                    |
                    +-- Faculty Views:
                    |     +-- /faculty/dashboard    --> [FacultyDashboardPage]
                    |     +-- /faculty/attendance   --> [AttendanceRosterEntryPage]
                    |     +-- /faculty/courses      --> [CourseManagementPage (Syllabus upload)]
                    |     +-- /faculty/assignments  --> [AssignmentGradingPage]
                    |     +-- /faculty/tickets      --> [AcademicTicketsInboxPage]
                    |
                    +-- Administrator Views:
                          +-- /admin/dashboard      --> [AdminAnalyticsDashboard]
                          +-- /admin/knowledge-base --> [RAGDocumentIngestionPage]
                          +-- /admin/faq-manager    --> [FaqCrudEditorPage]
                          +-- /admin/users          --> [UserManagementPage]
                          +-- /admin/tickets        --> [HelpdeskKanbanBoardPage]
                          +-- /admin/audit-logs     --> [SystemAuditLogsPage]
```

### 2.2 Frontend Layered Architecture

```
+----------------------------------------------------------------------------+
|                         VIEW LAYER (UI COMPONENTS)                         |
|  - Atomic Design: UI Primitives (Buttons, Badges, Modals, Inputs, Skeletons)
|  - Composite Modules: ChatWidget, TimetableGrid, AttendanceGauge, Ledgers  |
+----------------------------------------------------------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------+
|                       STATE & STORE MANAGEMENT LAYER                       |
|  - AuthStore (Zustand): Current User, JWT Token, Roles, Logout Action      |
|  - ChatStore (Zustand): Active Session ID, Stream Buffer, Message History  |
|  - UIStore (Zustand): Sidebar Collapse, Dark/Light Mode, Active Toasts     |
+----------------------------------------------------------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------+
|                       DATA FETCHING & CACHING LAYER                        |
|  - TanStack Query (React Query): Server state caching, stale-while-revalidate
|  - Query Keys: ['attendance', studentId], ['exams', term], ['courses']    |
|  - Automatic Background Polling & Optimistic Updates                       |
+----------------------------------------------------------------------------+
                                      |
                                      v
+----------------------------------------------------------------------------+
|                     NETWORK & COMMUNICATION CLIENT LAYER                   |
|  - Axios Instance: Bearer Token Interceptor, 401 Silent Refresh Handler    |
|  - Streaming Client: Native `fetch` + `ReadableStream` Reader (for SSE)   |
|  - WebSocket Client: Socket.io-client for ticket updates and notifications |
+----------------------------------------------------------------------------+
```

---

## 3. Backend Architecture

The backend follows the **Controller-Service-Repository** pattern with strict encapsulation, centralized error handling, and a dedicated AI Tool Orchestration layer.

### 3.1 Layered Backend Diagram (ASCII)

```
                 Incoming HTTP Request (REST / SSE)
                               |
                               v
+----------------------------------------------------------------------------+
|                          EXPRESS PIPELINE LAYER                            |
|  - helmet()                 --> Security HTTP headers                      |
|  - cors(allowedOrigins)     --> Cross-Origin validation                    |
|  - express.json({limit})    --> JSON payload parsing                      |
|  - requestLogger            --> Morgan HTTP request logging                |
|  - apiRateLimiter           --> Express-rate-limit protection (DDoS)       |
+----------------------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------------------+
|                     AUTHENTICATION & RBAC MIDDLEWARE                       |
|  - verifyJwtToken           --> Decodes JWT, validates signature & expiry  |
|  - authorizeRoles('student')--> Validates role against route requirements  |
|  - attachUserContext        --> Injects req.user (id, role, department)    |
+----------------------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------------------+
|                         ROUTING & CONTROLLER LAYER                         |
|  - Input Validation: Joi / Zod validation schemas                          |
|  - Extracts params/body: Sanitizes inputs                                 |
|  - Dispatches to business services                                         |
+----------------------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------------------+
|                           BUSINESS SERVICE LAYER                           |
|  +------------------------+  +--------------------+  +------------------+  |
|  | StudentService         |  | AttendanceService  |  | CourseService    |  |
|  | - calculateGPA()       |  | - getThreshold()   |  | - getSyllabus()  |  |
|  | - getProfile()         |  | - markBatch()      |  | - checkPrereq()  |  |
|  +------------------------+  +--------------------+  +------------------+  |
|  +----------------------------------------------------------------------+  |
|  |                      AI Agent Orchestration Service                  |  |
|  |  - buildSystemPrompt(userRole, profileContext)                       |  |
|  |  - filterContentSafety(prompt)                                       |  |
|  |  - executeToolCall(functionName, args, studentId)                    |  |
|  |  - queryAzureHybridSearch(query, filterTags)                         |  |
|  |  - streamLlmResponseToClient(res, openAiStream)                      |  |
|  +----------------------------------------------------------------------+  |
+----------------------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------------------+
|                        DATA ACCESS / REPOSITORY LAYER                      |
|  - Mongoose Models & Custom Queries (Lean execution, Population)          |
|  - Redis Client (Cache Get/Set, Cache Invalidation on Mutations)           |
+----------------------------------------------------------------------------+
                               |
                               v
+----------------------------------------------------------------------------+
|                             DATABASE & STORAGE                             |
|  - MongoDB Atlas (Replica Set)   |   Azure Blob Storage (PDF Syllabi)     |
+----------------------------------------------------------------------------+
```

---

## 4. Database Collections & Data Modeling

### 4.1 Schema Relationship & Data Flow Diagram (ASCII)

```
    +-------------------------+
    |          users          |
    |-------------------------|
    | _id (ObjectId)          |<-------------------------+
    | userId ("STU-1029")     |                          |
    | role (enum)             |                          |
    | email / passwordHash    |                          |
    | studentProfile / faculty|                          |
    +-------------------------+                          |
        |                 |                              |
 1 to N |          1 to N |                              |
        v                 v                              |
+-----------------+ +--------------------+         +---------------------+
|   enrollments   | | attendance_records |         |    fee_accounts     |
|-----------------| |--------------------|         |---------------------|
| studentId (FK)  | | studentId (FK)     |         | studentId (FK) (1:1)|
| courseId (FK)---+ | courseId (FK)------+         | totalAssessed       |
| semester / grade| | date / status      |         | outstandingBalance  |
+-----------------+ +--------------------+         | nextDueDate         |
        |                     |                    +---------------------+
 N to 1 |              N to 1 |                               |
        v                     v                        1 to N |
+--------------------------------+                            v
|            courses             |                 +---------------------+
|--------------------------------|                 |  fee_transactions   |
| _id (ObjectId)                 |                 |---------------------|
| courseCode ("CS101")           |                 | feeAccountId (FK)   |
| title / credits / department   |                 | transactionId       |
| leadInstructorId (FK -> users) |                 | amount / method     |
| syllabusDocumentUrl            |                 +---------------------+
+--------------------------------+
        |                 |
 1 to N |          1 to N |
        v                 v
+-----------------+ +--------------------+         +---------------------+
|   assignments   | |   exam_schedules   |         |   campus_services   |
|-----------------| |--------------------|         |---------------------|
| courseId (FK)   | | courseId (FK)      |         | name / category     |
| dueDate / points| | examDate / time    |         | location / phone    |
+-----------------+ | room / seatNumber  |         | operationalHours    |
        |           +--------------------+         +---------------------+
 1 to N |
        v
+-----------------+ +--------------------+         +---------------------+
|   submissions   | |   chat_sessions    | 1 to N  |    chat_messages    |
|-----------------| |--------------------|-------->|---------------------|
| assignmentId(FK)| | userId (FK)        |         | sessionId (FK)      |
| studentId (FK)  | | startedAt / status |         | sender / content    |
| fileUrl / score | +--------------------+         | toolCalls (array)   |
+-----------------+           |                    +---------------------+
                              | 1 to 1 (optional)
                              v
                    +--------------------+
                    |  support_tickets   |
                    |--------------------|
                    | ticketNumber       |
                    | studentId (FK)     |
                    | assignedTo (FK)    |
                    | priority / status  |
                    +--------------------+
```

### 4.2 Indexes & Optimization Strategies

| Collection | Primary Index | Compound & Secondary Indexes | Strategy |
| :--- | :--- | :--- | :--- |
| `users` | `_id: 1` | `email: 1` (Unique), `userId: 1` (Unique), `role: 1` | Rapid auth lookup and role filtering |
| `courses` | `_id: 1` | `courseCode: 1` (Unique), `department: 1, semester: 1` | Instant catalog queries and prerequisite check |
| `enrollments` | `_id: 1` | `{ studentId: 1, courseId: 1, academicYear: 1 }` (Unique) | Eliminates duplicate student registrations |
| `attendance_records` | `_id: 1` | `{ studentId: 1, courseId: 1, date: -1 }` | Fast calculation of percentage thresholds |
| `exam_schedules` | `_id: 1` | `{ courseId: 1, examDate: 1 }`, `{ "seatingArrangements.studentId": 1 }` | Fast hall ticket generation per student |
| `assignments` | `_id: 1` | `{ courseId: 1, dueDate: 1 }` | Fast retrieval of active/upcoming tasks |
| `submissions` | `_id: 1` | `{ assignmentId: 1, studentId: 1 }` (Unique) | Enforces single submission per student |
| `chat_messages` | `_id: 1` | `{ sessionId: 1, timestamp: 1 }` | Fast pagination of conversation history |
| `faq_items` | `_id: 1` | `{ category: 1 }`, Text index on `{ question: "text", answer: "text" }` | Instant fallback search when offline |

---

## 5. Complete REST API Structure

All endpoints are prefixed with `/api/v1`. Authentication is passed via HTTP Header: `Authorization: Bearer <JWT_ACCESS_TOKEN>`.

### 5.1 Authentication & Profile (`/api/v1/auth`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Email/Password login, returns access token & sets HTTP-only refresh token cookie | Public |
| `POST` | `/auth/refresh` | Generates a new access token using the HTTP-only refresh token | Public |
| `POST` | `/auth/logout` | Clears refresh token cookie and invalidates session | Authenticated |
| `GET` | `/auth/me` | Fetches current user profile and role capabilities | Authenticated |

### 5.2 Academic & Course Services (`/api/v1/courses`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/courses` | List all university courses with department and semester filters | Authenticated |
| `GET` | `/courses/:courseId` | Course details including prerequisites and syllabus link | Authenticated |
| `GET` | `/courses/my-courses` | Enrolled courses for students; assigned courses for faculty | Student / Faculty |
| `POST` | `/courses` | Create a new course offering | Admin |
| `PUT` | `/courses/:courseId/syllabus` | Upload syllabus document (stores in Azure Blob & triggers index) | Faculty / Admin |

### 5.3 Attendance Module (`/api/v1/attendance`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/attendance/my-summary` | Aggregated attendance percentage per course with warning flags | Student |
| `GET` | `/attendance/course/:courseId` | Detailed class-by-class attendance records for a student | Student / Faculty |
| `POST` | `/attendance/mark-batch` | Mark daily attendance for an entire class roster | Faculty / Admin |
| `GET` | `/attendance/low-attendance-alerts`| List of students with attendance < 75% | Faculty / Admin |

### 5.4 Examination & Hall Ticket Module (`/api/v1/exams`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/exams/my-schedule` | Personalized exam timetable with hall numbers and seat allocations | Student |
| `GET` | `/exams/hall-ticket` | Generates verified digital hall ticket metadata with QR signature | Student |
| `GET` | `/exams/export-calendar` | Generates `.ics` iCalendar export file | Student |
| `POST` | `/exams/schedule` | Publish examination dates, room allocations, and seat plans | Admin |

### 5.5 Assignments & Deadlines (`/api/v1/assignments`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/assignments/my-pending` | List all upcoming assignments sorted by urgency | Student |
| `POST` | `/assignments/:id/submit` | Upload file/link for assignment submission | Student |
| `POST` | `/assignments` | Create a new assignment prompt with deadline and rubric | Faculty |
| `GET` | `/assignments/:id/submissions` | View and grade student submissions | Faculty |

### 5.6 Finance & Fees (`/api/v1/fees`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/fees/my-account` | Current fee balance, breakdown of charges, and due dates | Student |
| `GET` | `/fees/transactions` | Payment history and receipts | Student |
| `POST` | `/fees/initiate-payment` | Generates encrypted merchant checkout session link | Student |
| `POST` | `/fees/webhook` | Bursar banking webhook verifying transaction completion | System |

### 5.7 Campus Services & FAQ (`/api/v1/campus` & `/api/v1/faqs`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/campus/services` | Campus directory, locations, operational hours, emergency contacts | Public / Auth |
| `GET` | `/faqs` | Categorized list of verified administrative FAQs | Public / Auth |
| `POST` | `/faqs` | Add or update official FAQ entries | Admin |

### 5.8 AI Conversational Agent (`/api/v1/ai`)
| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/ai/chat/stream` | Primary SSE endpoint: streams real-time grounded conversational responses | Student / Faculty |
| `GET` | `/ai/sessions` | Fetch user conversation session history | Authenticated |
| `GET` | `/ai/sessions/:id/messages` | Load message log for a specific conversation session | Authenticated |
| `POST` | `/ai/escalate` | Escalate a conversation into a human support ticket | Student |
| `POST` | `/ai/admin/sync-rag` | Trigger manual document indexing pipeline into Azure AI Search | Admin |

---

## 6. Authentication & Authorization Flow

The system employs a high-security **Dual-Token Pattern (Access Token + Rotating Refresh Token)** with Role-Based Access Control (RBAC).

### 6.1 Authentication Sequence Diagram (ASCII)

```
+---------+              +-------------+             +------------+             +--------------+
| Client  |              | Node.js API |             | MongoDB    |             | Secure Cookie|
+---------+              +-------------+             +------------+             +--------------+
     |                          |                          |                           |
     | 1. POST /auth/login      |                          |                           |
     |    { email, password }   |                          |                           |
     |------------------------->|                          |                           |
     |                          | 2. Find user by email    |                           |
     |                          |------------------------->|                           |
     |                          | 3. Return user doc       |                           |
     |                          |<-------------------------|                           |
     |                          |                          |                           |
     |                          | 4. Verify passwordHash   |                           |
     |                          |    using bcrypt.compare  |                           |
     |                          |                          |                           |
     |                          | 5. Sign Access JWT (15m) |                           |
     |                          |    Sign Refresh JWT (7d) |                           |
     |                          |                          |                           |
     |                          | 6. Save Refresh Hash     |                           |
     |                          |------------------------->|                           |
     |                          |                          |                           |
     | 7. HTTP 200 Response     |                          |                           |
     |    Payload: AccessToken  |                          | 8. Set-Cookie:            |
     |    User Profile & Roles  |                          |    refreshToken (HttpOnly,|
     |<-------------------------|----------------------------------------------->| Secure, SameSite)
     |                          |                          |                           |
     |=================================================================================|
     |                          SUBSEQUENT SECURE API REQUESTS                         |
     |=================================================================================|
     |                          |                          |                           |
     | 9. GET /attendance/my    |                          |                           |
     |    Header: Bearer Token  |                          |                           |
     |------------------------->|                          |                           |
     |                          | 10. verifyToken(jwt)     |                           |
     |                          | 11. checkRole('student') |                           |
     |                          | 12. Execute service logic|                           |
     | 13. Return Data (200 OK) |                          |                           |
     |<-------------------------|                          |                           |
     |                          |                          |                           |
     |=================================================================================|
     |                     TOKEN REFRESH CYCLE (WHEN ACCESS EXPIRES)                   |
     |=================================================================================|
     |                          |                          |                           |
     | 14. GET /api/v1/data     |                          |                           |
     |------------------------->|                          |                           |
     | 15. 401 Unauthorized     | (Access token expired)   |                           |
     |<-------------------------|                          |                           |
     |                          |                          |                           |
     | 16. POST /auth/refresh   |                          | 17. Automatically includes|
     |------------------------->|------------------------->|     HttpOnly Cookie       |
     |                          |                          |                           |
     |                          | 18. Verify Refresh Token |                           |
     |                          | 19. Rotate: New Access + |                           |
     |                          |     New Refresh Token    |                           |
     | 20. Return new Access JWT|                          |                           |
     |<-------------------------|----------------------------------------------------->|
     |                          |                          |
```

---

## 7. AI Integration & RAG Orchestration Flow

UniAssist AI's reasoning engine combines **Azure AI Search** for static university guidelines with **Autonomous Tool Calling** for dynamic student data.

### 7.1 AI Tool Registry
The agent is equipped with strict JSON-schema declared tools that map directly to internal Node.js service functions:
1. `get_student_attendance(studentId, courseCode)`: Returns attended, total classes, and current percentage.
2. `get_exam_timetable(studentId)`: Returns upcoming dates, timings, venues, and seat numbers.
3. `get_assignment_deadlines(studentId)`: Returns pending assignments and submission countdowns.
4. `get_fee_balance(studentId)`: Returns outstanding financial balance, breakdowns, and due dates.
5. `escalate_to_human_ticket(studentId, subject, description, priority)`: Creates a ticket in MongoDB and alerts staff.

### 7.2 AI Agent Orchestration Flow Diagram (ASCII)

```
Student Query: "What is my CS101 attendance, and what happens if I miss tomorrow's exam?"
                                  |
                                  v
+------------------------------------------------------------------------------------+
|                         BACKEND: PRE-PROCESSING & GUARDRAILS                       |
|  1. Inject Authenticated Student Context: { studentId: "STU-9021", name: "Alex" }  |
|  2. Azure Content Safety Check: Validate against prompt injection and toxicity     |
+------------------------------------------------------------------------------------+
                                  |
                                  v
+------------------------------------------------------------------------------------+
|                       AZURE OPENAI (GPT-4o / GPT-4o-mini)                          |
|  Prompt: System Persona + Student Profile + Chat History + User Message            |
|  Available Tools: [get_student_attendance, get_exam_timetable, get_fee_balance]   |
+------------------------------------------------------------------------------------+
                                  |
               Decision: Tool Call Required & Document RAG
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v (Dynamic Data)                                    v (Static Policy)
+-------------------------------+               +-----------------------------------+
|  BACKEND TOOL DISPATCHER      |               |  AZURE AI SEARCH (HYBRID RAG)     |
|  Function:                    |               |  Vector Query:                    |
|  `get_student_attendance(     |               |  "missed exam policy consequence" |
|     studentId="STU-9021",     |               |  Semantic Reranker Score > 0.82   |
|     courseCode="CS101")`      |               |                                   |
|  Result:                      |               |  Result Document:                 |
|  { attended: 21, total: 24,   |               |  "Students missing an exam due to |
|    percentage: 87.5% }        |               |   illness must submit Form MED-1  |
+-------------------------------+               |   within 48 hours for re-test."   |
        |                                       +-----------------------------------+
        |                                                   |
        +-------------------------+-------------------------+
                                  |
                                  v
+------------------------------------------------------------------------------------+
|                     AZURE OPENAI SYNTHESIS & FINAL RESPONSE                        |
|  Agent contextualizes both sources:                                                |
|  "Your attendance in CS101 is currently 87.5% (21/24 classes). Regarding missing  |
|   tomorrow's exam: university policy mandates that you must submit Form MED-1      |
|   with valid medical proof within 48 hours to be eligible for a make-up test."     |
+------------------------------------------------------------------------------------+
                                  |
                                  v
+------------------------------------------------------------------------------------+
|                         POST-PROCESSING & STREAM DISPATCH                          |
|  1. Azure Content Safety Output Filtering                                          |
|  2. Server-Sent Events (SSE) stream pushed chunk-by-chunk to the React Frontend    |
+------------------------------------------------------------------------------------+
```

---

## 8. Production Deployment Architecture

The production environment is hosted entirely on **Microsoft Azure Cloud** and **MongoDB Atlas**, adhering to enterprise high-availability, scalability, and disaster recovery standards.

### 8.1 Cloud Infrastructure Diagram (ASCII)

```
                                  [ Internet Traffic ]
                                           |
                                           v
+=====================================================================================+
|                             AZURE FRONT DOOR / CLOUD CDN                            |
|  - Global Anycast IP Routing                                                        |
|  - Web Application Firewall (WAF) & DDoS Protection                                 |
|  - TLS 1.3 Termination & Edge Caching for Static React Assets                       |
+==========================================+==========================================+
                                           |
                    +----------------------+----------------------+
                    | Route: /* (Static)                          | Route: /api/* (API)
                    v                                             v
+=======================================+     +=======================================+
|     AZURE BLOB STATIC WEB HOSTING     |     |     AZURE APP SERVICE / LINUX PLAN    |
|  - Production React SPA Bundle        |     |  - Node.js 20 Express Backend         |
|  - Vite Build Output (HTML, CSS, JS)  |     |  - Docker Containerized Deployment    |
|  - Optimized WebP Assets              |     |  - Auto-scaling (2 to 10 instances)   |
+=======================================+     +===================+===================+
                                                                  |
                +-------------------------------------------------+-------------------------------------------------+
                | Private VNet Peering                                                                              | Private Endpoint
                v                                                                                                   v
+===================================================+                             +===================================================+
|               MONGODB ATLAS CLUSTER               |                             |             AZURE AI FOUNDRY SUITE                |
|  - Dedicated M10+ Tier with 3-Node Replica Set    |                             |  - Azure OpenAI Service (Private Endpoint)        |
|  - Encrypted at Rest (Customer Managed Keys)      |                             |  - Azure AI Search (Dedicated Search Units)       |
|  - Automated Daily Snapshots & Point-in-Time Recovery                           |  - Azure AI Content Safety Service                |
|  - Network IP Access Restricted to Azure App VNet |                             |  - Azure Storage Account (Document Knowledge Base)|
+===================================================+                             +===================================================+
                                                                                                    ^
                                                                                                    |
+===================================================================================================+=================+
|                                         OBSERVABILITY & SECRETS MANAGEMENT                                          |
|  +-------------------------------------------------------+  +----------------------------------------------------+  |
|  |                  Azure Key Vault                      |  |             Azure Application Insights             |  |
|  |  - MongoDB Connection String, JWT Secrets             |  |  - Real-Time APM Tracing & Metric Monitoring       |  |
|  |  - Azure AI API Keys, Content Safety Keys             |  |  - Structured Error Tracking, AI Token Usage & Costs|  |
|  +-------------------------------------------------------+  +----------------------------------------------------+  |
+=====================================================================================================================+
```

### 8.2 CI/CD Automation Pipeline (GitHub Actions)

```
   [Developer Push / Pull Request to `main`]
                     |
                     v
+-----------------------------------------------------+
|                  STAGE 1: TEST & LINT               |
|  - Run ESLint on Frontend & Backend                 |
|  - Run Vitest unit tests for Controllers & Services |
|  - Validate Mongoose Schema definitions             |
+--------------------------+--------------------------+
                           | Passed
                           v
+-----------------------------------------------------+
|                  STAGE 2: BUILD                     |
|  - Build React SPA via Vite (`npm run build`)       |
|  - Build Docker image for Node.js backend           |
|  - Push Docker image to Azure Container Registry(ACR|
+--------------------------+--------------------------+
                           |
                           v
+-----------------------------------------------------+
|                  STAGE 3: DEPLOY                     |
|  - Deploy static assets to Azure Blob / CDN         |
|  - Deploy Container to Azure App Service (Zero-     |
|    downtime Blue/Green slot swapping)               |
|  - Run Database migration and seed check scripts    |
+-----------------------------------------------------+
```

---

## 9. Summary & Architecture Guarantees

The architecture specified above provides five foundational guarantees:
1. **Zero Hallucination with Dynamic Grounding:** Real-time student queries rely on verified database records through Tool Calling, while policy inquiries rely exclusively on semantically indexed university handbooks in Azure AI Search.
2. **Sub-3-Second Streaming Latency:** The combination of GPT-4o-mini, Server-Sent Events (SSE), and Redis-cached user tokens ensures instant, interactive typing animations for students.
3. **Enterprise Role Security (FERPA Compliant):** Multi-tenant RBAC ensures that student academic and financial records are strictly isolated and never leaked via conversational prompts.
4. **Resilient Human Escalation:** Inability to resolve a query triggers an automated workflow converting the active chat transcript into an assigned staff support ticket.
5. **Horizontal Cloud Scalability:** Stateless backend services hosted on auto-scaling Azure App Service instances ensure smooth performance even during peak enrollment and examination periods.
