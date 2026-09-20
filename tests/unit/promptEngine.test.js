/**
 * Unit Test Suite: Prompt Engine & Context Injection
 */
import { buildSystemPromptWithContext, SYSTEM_BASE_PERSONA, FEW_SHOT_EXEMPLARS } from '../../services/promptEngine.js';

export const runPromptEngineUnitTests = () => {
  console.log('\n--- [TEST SUITE: Prompt Engine & Persona Injection] ---');
  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
    }
  };

  // 1. Verify Base Persona Rules
  assert(SYSTEM_BASE_PERSONA.includes('UniAssist AI'), 'Base persona identifies as UniAssist AI');
  assert(SYSTEM_BASE_PERSONA.includes('FERPA'), 'Base persona enforces FERPA privacy regulations');
  assert(SYSTEM_BASE_PERSONA.includes('search_university_policy_rag'), 'Base persona instructs RAG retrieval');
  assert(SYSTEM_BASE_PERSONA.includes('+1-555-HELP'), 'Base persona contains emergency crisis helpline');

  // 2. Student Context Injection Test
  const mockUser = {
    firstName: 'Alex',
    lastName: 'Mercer',
    fullName: 'Alex Mercer',
    email: 'alex.student@university.edu',
    role: 'student'
  };

  const mockStudentProfile = {
    studentId: 'STU-2024-8842',
    department: 'Computer Science',
    degreeProgram: 'B.S. in Computer Science',
    currentSemester: 5,
    cgpa: 3.82,
    enrolledCourses: [{ courseId: { courseCode: 'CS-301' }, status: 'enrolled' }]
  };

  const studentPrompt = buildSystemPromptWithContext(mockUser, mockStudentProfile);

  assert(studentPrompt.includes('STU-2024-8842'), 'Student prompt correctly injects student roll number');
  assert(studentPrompt.includes('Semester 5'), 'Student prompt correctly injects current semester');
  assert(studentPrompt.includes('CS-301'), 'Student prompt correctly injects enrolled course code');
  assert(studentPrompt.includes('alex.student@university.edu'), 'Student prompt correctly injects university email');

  // 3. Guest / Unauthenticated Fallback Test
  const guestPrompt = buildSystemPromptWithContext(null);
  assert(guestPrompt.includes('Guest / Unauthenticated'), 'Guest prompt specifies unauthenticated access');
  assert(guestPrompt.includes('Public FAQs and general directory'), 'Guest access restricted to public information');

  // 4. Few-Shot Exemplars Verification
  assert(FEW_SHOT_EXEMPLARS.length > 0, 'Few-shot exemplars array is populated');
  assert(FEW_SHOT_EXEMPLARS[1].tool_calls[0].function.name === 'get_student_attendance', 'Few-shot exemplar illustrates get_student_attendance tool calling');

  console.log(`Result: ${passed}/${total} assertions passed.`);
  return { passed, total };
};
