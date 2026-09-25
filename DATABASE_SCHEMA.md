# University Student Support Agent (UniAssist AI)
## MongoDB Database Schema & Data Dictionary

This document specifies the complete MongoDB database architecture and data modeling for the **University Student Support Agent (UniAssist AI)**. It details collection schemas, data types, validation rules, indexing strategies, referential integrity, and relationships.

---

## 1. Entity Relationship Diagram (ASCII)

```
=============================================================================================================
                                          DATABASE RELATIONSHIP MAP
=============================================================================================================

            +-------------------------------------------------------------+
            |                            Users                            |
            |-------------------------------------------------------------|
            | _id (PK)                   email (Unique)                   |
            | role ('student'|'faculty'  passwordHash                     |
            |       |'admin')            firstName, lastName, phone       |
            +-------------------------------------------------------------+
                           |                               |
       1-to-1 (via userId) |           1-to-1 (via userId) |
                           v                               v
+------------------------------------+  +------------------------------------+
|              Students              |  |              Faculty               |
|------------------------------------|  |------------------------------------|
| _id (PK)                           |  | _id (PK)                           |
| userId (FK -> Users._id) [Unique]  |  | userId (FK -> Users._id) [Unique]  |
| studentId ("STU-2024-001") [Unique]|  | employeeId ("FAC-1002") [Unique]   |
| department, program, semester      |  | department, designation            |
| academicAdvisor (FK -> Faculty)    |  | cabinOffice, officeHours           |
| cgpa, completedCredits             |  | assignedCourses [Array of FKs]     |
+------------------------------------+  +------------------------------------+
         |                 ^                           |
         |                 |                           | 1-to-Many
         |                 |                           v
         |                 |            +------------------------------------+
         |                 |            |              Courses               |
         |                 |            |------------------------------------|
         |                 |            | _id (PK)                           |
         |                 |            | courseCode ("CS-301") [Unique]     |
         |                 |            | courseName, department, credits    |
         |                 |            | leadFaculty (FK -> Faculty._id)    |
         |                 |            | syllabus { overview, documentUrl } |
         |                 |            | schedule [{ day, time, room }]     |
         |                 |            +------------------------------------+
         |                 |                 |                  |
         |                 |                 | 1-to-Many        | 1-to-Many
         v                 |                 v                  v
+-----------------------------+  +----------------------+ +----------------------+
|         Attendance          |  |     Assignments      | |    Notifications     |
|-----------------------------|  |----------------------| |----------------------|
| _id (PK)                    |  | _id (PK)             | | _id (PK)             |
| course (FK -> Courses._id)  |  | course (FK -> Course)| | recipient (FK->Users)|
| student (FK -> Students._id)|  | createdBy (FK->Fac)  | | sender (FK->Users)   |
| faculty (FK -> Faculty._id) |  | title, maxScore      | | type, priority       |
| date, sessionType           |  | dueDate, attachments | | title, message       |
| status (present/absent/late)|  | submissions [Array:  | | actionUrl, isRead    |
| remarks                     |  |  student, file, grade| | expiresAt (TTL Index)|
+-----------------------------+  +----------------------+ +----------------------+
                                                                    ^
                                                                    |
+------------------------------------+  +---------------------------+--------+
|           QuestionPapers           |  |            Chat History            |
|------------------------------------|  |------------------------------------|
| _id (PK)                           |  | _id (PK)                           |
| title (String)                     |  | sessionId (UUIDv4) [Unique]        |
| examType, difficulty, totalMarks   |  | user (FK -> Users._id)             |
| syllabusText (String Snippet)      |  | userRole ('student'|'faculty')     |
| generatedPaper (Markdown)          |  | sessionTitle, status               |
| answerKey (Markdown)               |  | messages [{ sender, content,       |
| createdBy (FK -> Users._id)        |  |   toolCalls, groundingSources }]   |
+------------------------------------+  +------------------------------------+
                   |
                   v
+------------------------------------+
|                FAQs                |
|------------------------------------|
| _id (PK)                           |
| category ('Academics'|'Fees'|...)  |
| question, answer, tags             |
| targetAudience, relatedCourse      |
| viewCount, helpfulCount            |
| isPublished (Boolean)              |
| azureSearchIndexed (Boolean)       |
| createdBy (FK -> Users._id)        |
+------------------------------------+
```

---

## 2. Collections Specification & Data Dictionary

### 2.1 `users` Collection
The centralized identity store containing credentials, contact information, and role indicators.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Internal MongoDB ID |
| `email` | `String` | Required, Unique, Lowercase, Trim | University email address |
| `passwordHash` | `String` | Required | Salted Bcrypt hash (min 10 rounds) |
| `firstName` | `String` | Required, Trim | User's legal first name |
| `lastName` | `String` | Required, Trim | User's legal last name |
| `role` | `String` | Enum: `['student', 'faculty', 'admin', 'super_admin']` | Role for Authorization & Access Control |
| `phoneNumber` | `String` | Optional, Regex format | Contact phone number |
| `avatarUrl` | `String` | Optional | Profile image URL |
| `isActive` | `Boolean` | Default: `true` | Account activation state |
| `lastLoginAt` | `Date` | Optional | Timestamp of last session |
| `refreshTokenHash` | `String` | Optional | Hashed active refresh token |
| `createdAt` | `Date` | Default: `Date.now` | Account creation timestamp |
| `updatedAt` | `Date` | Default: `Date.now` | Last update timestamp |

**Indexes:**
- `{ email: 1 }` (Unique)
- `{ role: 1 }`

---

### 2.2 `students` Collection
Stores student-specific academic records, degree requirements, and academic advisor links.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Student profile document ID |
| `userId` | `ObjectId` | Ref: `User`, Required, Unique | One-to-one reference to base User |
| `studentId` | `String` | Required, Unique, Uppercase | Institutional Roll Number (e.g. `STU-2024-001`) |
| `department` | `String` | Required | Department (e.g., "Computer Science & Engineering") |
| `degreeProgram` | `String` | Required | Program title (e.g., "B.S. in Computer Science") |
| `currentSemester` | `Number` | Required, Min: 1, Max: 12 | Current academic semester |
| `admissionYear` | `Number` | Required | Year of entry (e.g., `2024`) |
| `batch` | `String` | Required | Cohort batch (e.g., `"2024-2028"`) |
| `academicAdvisor` | `ObjectId` | Ref: `Faculty`, Optional | Assigned faculty mentor |
| `enrolledCourses` | `Array` | Subdocuments | Array of currently enrolled course links |
| `enrolledCourses.$.courseId` | `ObjectId` | Ref: `Course` | Enrolled course reference |
| `enrolledCourses.$.semester` | `Number` | Required | Semester when enrolled |
| `enrolledCourses.$.status` | `String` | Enum: `['enrolled', 'completed', 'dropped']` | Enrollment state |
| `cgpa` | `Number` | Min: 0.0, Max: 4.0, Default: 0.0 | Cumulative Grade Point Average |
| `completedCredits` | `Number` | Default: 0 | Total credits completed toward graduation |
| `emergencyContact` | `Object` | Embedded Document | `{ name, relationship, phone }` |

**Indexes:**
- `{ userId: 1 }` (Unique)
- `{ studentId: 1 }` (Unique)
- `{ department: 1, currentSemester: 1 }`

---

### 2.3 `faculty` Collection
Stores faculty profiles, academic designations, office hours, and assigned courses.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Faculty profile ID |
| `userId` | `ObjectId` | Ref: `User`, Required, Unique | One-to-one reference to base User |
| `employeeId` | `String` | Required, Unique, Uppercase | Faculty staff ID (e.g. `FAC-1002`) |
| `department` | `String` | Required | Academic department |
| `designation` | `String` | Required | Title (e.g., "Associate Professor") |
| `specialization` | `Array of String` | Optional | Areas of research/teaching |
| `cabinOffice` | `String` | Required | Physical office (e.g., "Building C, Room 304") |
| `officeHours` | `Array` | Subdocuments | `[{ dayOfWeek, startTime, endTime, location }]` |
| `assignedCourses` | `Array of ObjectId` | Ref: `Course` | Courses currently taught by this instructor |

**Indexes:**
- `{ userId: 1 }` (Unique)
- `{ employeeId: 1 }` (Unique)
- `{ department: 1 }`

---

### 2.4 `courses` Collection
University course catalog containing credit information, syllabi, schedules, and prerequisites.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Course document ID |
| `courseCode` | `String` | Required, Unique, Uppercase | Course code (e.g., `"CS-301"`, `"ENG-102"`) |
| `courseName` | `String` | Required | Official course title |
| `description` | `String` | Optional | Course summary and goals |
| `department` | `String` | Required | Department offering the course |
| `credits` | `Number` | Required, Min: 1, Max: 6 | Credit units |
| `semester` | `Number` | Required | Target curriculum semester |
| `leadFaculty` | `ObjectId` | Ref: `Faculty`, Required | Primary instructor responsible for course |
| `prerequisites` | `Array of ObjectId`| Ref: `Course` | Required preceding courses |
| `syllabus` | `Object` | Embedded Document | `{ overview, documentUrl, weeklyTopics: [...] }` |
| `schedule` | `Array` | Subdocuments | Class timetable `[{ dayOfWeek, startTime, endTime, roomNumber, classType }]` |
| `maxCapacity` | `Number` | Default: 60 | Maximum student enrollment capacity |
| `isActive` | `Boolean` | Default: `true` | Course active status |

**Indexes:**
- `{ courseCode: 1 }` (Unique)
- `{ department: 1, semester: 1 }`
- `{ leadFaculty: 1 }`

---

### 2.5 `attendance` Collection
Granular, per-session student attendance tracking used by the AI Agent to compute real-time percentages and issue low-attendance alerts.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Attendance record ID |
| `course` | `ObjectId` | Ref: `Course`, Required | Course session attended |
| `student` | `ObjectId` | Ref: `Student`, Required | Enrolled student |
| `faculty` | `ObjectId` | Ref: `Faculty`, Required | Faculty instructor conducting session |
| `date` | `Date` | Required | Date of the class session |
| `sessionType` | `String` | Enum: `['lecture', 'lab', 'tutorial']`, Default: `'lecture'` | Type of classroom instruction |
| `status` | `String` | Enum: `['present', 'absent', 'late', 'excused']`, Required | Attendance status |
| `markedBy` | `ObjectId` | Ref: `User` | User ID of person who marked attendance |
| `remarks` | `String` | Optional | Reason for excuse or note |

**Indexes:**
- `{ course: 1, student: 1, date: 1, sessionType: 1 }` (Unique Compound Index – prevents double marking)
- `{ student: 1, course: 1, status: 1 }` (Optimized for AI Agent percentage calculations)
- `{ date: -1 }`

---

### 2.6 `assignments` Collection
Course assignments, deadlines, attachments, and embedded student submission records.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Assignment document ID |
| `course` | `ObjectId` | Ref: `Course`, Required | Associated course |
| `createdBy` | `ObjectId` | Ref: `Faculty`, Required | Instructor who created assignment |
| `title` | `String` | Required | Assignment title |
| `description` | `String` | Required | Detailed instructions and prompt |
| `maxScore` | `Number` | Required, Default: 100 | Maximum possible points |
| `assignedDate` | `Date` | Default: `Date.now` | Date published |
| `dueDate` | `Date` | Required | Submission cut-off deadline |
| `attachmentUrl` | `String` | Optional | Link to PDF prompt/resource in Azure Blob |
| `allowedFileTypes` | `Array of String` | Default: `['.pdf', '.zip']` | Permitted file extensions |
| `submissions` | `Array` | Subdocuments | Array of student submissions |
| `submissions.$.student` | `ObjectId` | Ref: `Student`, Required | Submitting student |
| `submissions.$.submittedAt` | `Date` | Default: `Date.now` | Submission timestamp |
| `submissions.$.fileUrl` | `String` | Required | Stored submission file URL |
| `submissions.$.status` | `String` | Enum: `['submitted', 'late', 'graded']` | Status |
| `submissions.$.grade` | `Number` | Optional | Score awarded |
| `submissions.$.feedback` | `String` | Optional | Faculty evaluator remarks |

**Indexes:**
- `{ course: 1, dueDate: 1 }`
- `{ "submissions.student": 1 }`

---

### 2.7 `notifications` Collection
In-app and system alerts delivered to Students, Faculty, and Administrators.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Notification ID |
| `recipient` | `ObjectId` | Ref: `User`, Required | Target user |
| `sender` | `ObjectId` | Ref: `User`, Optional | Originating user or null (system) |
| `type` | `String` | Enum: `['attendance_alert', 'exam_reminder', 'assignment_deadline', 'fee_due', 'system_announcement', 'ticket_update']` | Notification category |
| `priority` | `String` | Enum: `['low', 'medium', 'high', 'critical']`, Default: `'medium'` | Severity level |
| `title` | `String` | Required | Brief summary headline |
| `message` | `String` | Required | Full notification body |
| `actionUrl` | `String` | Optional | Deep link to relevant portal section |
| `metadata` | `Mixed` | Optional | Extra JSON payload (e.g., `{ courseCode: 'CS-301' }`) |
| `isRead` | `Boolean` | Default: `false` | Read receipt flag |
| `readAt` | `Date` | Optional | Read timestamp |
| `createdAt` | `Date` | Default: `Date.now` | Timestamp of issuance |
| `expiresAt` | `Date` | Index (TTL: expires after duration) | Auto-cleanup timestamp (e.g., 90 days) |

**Indexes:**
- `{ recipient: 1, isRead: 1, createdAt: -1 }`
- `{ expiresAt: 1 }` (TTL index)

---

### 2.8 `faqs` Collection
Repository of verified institutional queries, categories, and tags, synced to Azure AI Search.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | FAQ item ID |
| `question` | `String` | Required, Trim | Query heading |
| `answer` | `String` | Required | Official verified response |
| `category` | `String` | Enum: `['Admissions', 'Academics', 'Examinations', 'Fees & Financial Aid', 'Hostel & Housing', 'Library & IT', 'Campus Facilities', 'General Support']` | Broad grouping |
| `tags` | `Array of String` | Optional | Keyword labels |
| `targetAudience` | `Array of String` | Enum: `['student', 'faculty', 'all']`, Default: `['all']` | Persona filter |
| `relatedCourse` | `ObjectId` | Ref: `Course`, Optional | Specific course reference if applicable |
| `viewCount` | `Number` | Default: 0 | Reader analytics |
| `helpfulCount` | `Number` | Default: 0 | Positive feedback votes |
| `notHelpfulCount` | `Number` | Default: 0 | Negative feedback votes |
| `isPublished` | `Boolean` | Default: `true` | Public visibility flag |
| `azureSearchIndexed` | `Boolean` | Default: `false` | Status flag for Azure AI Search sync |
| `createdBy` | `ObjectId` | Ref: `User` | Admin author |

**Indexes:**
- Text Index: `{ question: "text", answer: "text", tags: "text" }`
- `{ category: 1, isPublished: 1 }`

---

### 2.9 `chat_history` Collection
Persists conversation sessions, multi-turn dialogue, tool-calling execution traces, and Azure AI Search grounding sources.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Document ID |
| `sessionId` | `String` | Required, Unique | Unique session UUIDv4 |
| `user` | `ObjectId` | Ref: `User`, Required | Authenticated user |
| `userRole` | `String` | Enum: `['student', 'faculty', 'admin']` | Role at time of session |
| `sessionTitle` | `String` | Default: `"New Inquiry"` | Auto-generated inquiry summary |
| `messages` | `Array` | Subdocuments | Array of ordered conversation turns |
| `messages.$.messageId` | `String` | Required | Unique turn UUID |
| `messages.$.sender` | `String` | Enum: `['user', 'assistant', 'system', 'tool']` | Speaker role |
| `messages.$.content` | `String` | Required | Markdown text or tool output |
| `messages.$.toolCalls` | `Array` | Subdocuments | `[{ toolName, parameters, result }]` |
| `messages.$.groundingSources` | `Array`| Subdocuments | `[{ documentTitle, sourceUrl, snippet, score }]` |
| `messages.$.timestamp` | `Date` | Default: `Date.now` | Message timestamp |
| `status` | `String` | Enum: `['active', 'closed', 'escalated']` | Session lifecycle state |
| `escalatedTicketId` | `String` | Optional | Support ticket ID if escalated |
| `lastActiveAt` | `Date` | Default: `Date.now` | Last interaction timestamp |

**Indexes:**
- `{ sessionId: 1 }` (Unique)
- `{ user: 1, lastActiveAt: -1 }`

---

### 2.10 `question_papers` Collection
Stores examination papers and answer keys generated dynamically by Azure OpenAI via the Teacher Portal.

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Document ID |
| `title` | `String` | Required, Default: `'AI Generated...'` | Title of the examination |
| `examType` | `String` | Enum: `['Mid-Term', 'End-Term', 'Quiz', 'Assignment', 'Practice Test', 'Final Examination']` | Type of assessment |
| `difficulty` | `String` | Enum: `['Easy', 'Medium', 'Hard', 'Mixed', 'mixed']` | Complexity level |
| `totalMarks` | `Number` | Required, Default: `100` | Maximum score possible |
| `syllabusText` | `String` | Optional | Extracted syllabus text snippet |
| `generatedPaper` | `String` | Required | Markdown formatted question paper |
| `answerKey` | `String` | Required | Markdown formatted answer key |
| `createdBy` | `ObjectId` | Ref: `User`, Required | Faculty member who generated the paper |
| `createdAt` | `Date` | Default: `Date.now` | Generated timestamp |
| `updatedAt` | `Date` | Default: `Date.now` | Last update timestamp |

**Indexes:**
- `{ createdBy: 1, createdAt: -1 }` (Used for rendering the Paper Repository history panel)
