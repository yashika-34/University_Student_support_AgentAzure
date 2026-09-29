const BASE_URL = 'http://127.0.0.1:5000';

const results = {
  passed: 0,
  failed: 0,
  details: []
};

const assert = (condition, description) => {
  if (condition) {
    results.passed++;
    results.details.push(`✅ PASS: ${description}`);
    console.log(`✅ PASS: ${description}`);
  } else {
    results.failed++;
    results.details.push(`❌ FAIL: ${description}`);
    console.error(`❌ FAIL: ${description}`);
  }
};

async function postJSON(url, data, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data)
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function getJSON(url, headers = {}) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers }
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function putJSON(url, data = {}, headers = {}) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data)
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING E2E PRODUCTION VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    // 1. Health check
    console.log('--- 1. System Health ---');
    const healthRes = await getJSON(`${BASE_URL}/health`);
    assert(healthRes.status === 200 && healthRes.data.status === 'healthy', 'Health check returns healthy status');
    assert(healthRes.data.database === 'connected', 'MongoDB database is connected');

    // 2. Auth & Login (Admin)
    console.log('\n--- 2. Authentication & Role-Based Access Control ---');
    const adminLogin = await postJSON(`${BASE_URL}/api/v1/auth/login`, {
      email: 'admin@uniassist.edu',
      password: 'Admin@1234'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin logs in successfully');
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Login as Teacher
    const teacherLogin = await postJSON(`${BASE_URL}/api/v1/auth/login`, {
      email: 'dr.alan@university.edu',
      password: 'Faculty@1234'
    });
    assert(teacherLogin.status === 200 && teacherLogin.data.token, 'Teacher logs in successfully');
    const teacherToken = teacherLogin.data.token;
    const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };

    // Login as Student
    const studentLogin = await postJSON(`${BASE_URL}/api/v1/auth/login`, {
      email: 'alex.student@university.edu',
      password: 'Student@1234'
    });
    assert(studentLogin.status === 200 && studentLogin.data.token, 'Student logs in successfully');
    const studentToken = studentLogin.data.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // 3. Security Assertions (Unauthorized & Forbidden)
    console.log('\n--- 3. Role-Based Security Enforcement ---');
    // Unauthenticated request to admin stats
    const unauthRes = await getJSON(`${BASE_URL}/api/v1/admin/stats`);
    assert(unauthRes.status === 401, 'Unauthenticated request receives 401 Unauthorized');

    // Student trying to access admin stats
    const studentAdminRes = await getJSON(`${BASE_URL}/api/v1/admin/stats`, studentHeaders);
    assert(studentAdminRes.status === 403, 'Student access to admin stats blocked with 403 Forbidden');

    // Teacher trying to access admin user management
    const teacherAdminRes = await getJSON(`${BASE_URL}/api/v1/admin/users`, teacherHeaders);
    assert(teacherAdminRes.status === 403, 'Teacher access to admin users blocked with 403 Forbidden');

    // Student trying to grade assignments
    const studentGradeRes = await putJSON(`${BASE_URL}/api/v1/assignments/660000000000000000000001/grade`, {}, studentHeaders);
    assert(studentGradeRes.status === 403, 'Student grading attempt blocked with 403 Forbidden');

    // 4. Student Workflows
    console.log('\n--- 4. Student Core Services ---');
    const meRes = await getJSON(`${BASE_URL}/api/v1/auth/me`, studentHeaders);
    assert(meRes.status === 200 && meRes.data.user?.role === 'student', 'Student profile fetched (/auth/me)');

    const attRes = await getJSON(`${BASE_URL}/api/v1/attendance/my`, studentHeaders);
    assert(attRes.status === 200 && Array.isArray(attRes.data.data), 'Student attendance records retrieved');

    const marksRes = await getJSON(`${BASE_URL}/api/v1/marks/my`, studentHeaders);
    assert(marksRes.status === 200, 'Student marks retrieved');

    const coursesRes = await getJSON(`${BASE_URL}/api/v1/courses`, studentHeaders);
    assert(coursesRes.status === 200 && Array.isArray(coursesRes.data.data), 'Courses directory retrieved');

    const examsRes = await getJSON(`${BASE_URL}/api/v1/exams`, studentHeaders);
    assert(examsRes.status === 200 && Array.isArray(examsRes.data.exams), 'Exam schedules retrieved');

    const noticesRes = await getJSON(`${BASE_URL}/api/v1/notifications/notices`, studentHeaders);
    assert(noticesRes.status === 200, 'University notices retrieved');

    const aptRes = await getJSON(`${BASE_URL}/api/v1/services/appointments`, studentHeaders);
    assert(aptRes.status === 200 && Array.isArray(aptRes.data.data), 'Student appointments retrieved');

    const tktRes = await getJSON(`${BASE_URL}/api/v1/services/tickets`, studentHeaders);
    assert(tktRes.status === 200 && Array.isArray(tktRes.data.data), 'Student tickets retrieved');

    const schRes = await getJSON(`${BASE_URL}/api/v1/services/scholarships`);
    assert(schRes.status === 200 && Array.isArray(schRes.data.data), 'Scholarships retrieved');

    const facRes = await getJSON(`${BASE_URL}/api/v1/services/faculty`, studentHeaders);
    assert(facRes.status === 200 && Array.isArray(facRes.data.faculty || facRes.data.data), 'Faculty directory for booking retrieved');

    // 5. Teacher Workflows
    console.log('\n--- 5. Teacher Core Services ---');
    const dashRes = await getJSON(`${BASE_URL}/api/v1/teacher/dashboard`, teacherHeaders);
    assert(dashRes.status === 200 && dashRes.data.dashboard, 'Teacher dashboard stats retrieved');

    const stuRes = await getJSON(`${BASE_URL}/api/v1/teacher/students`, teacherHeaders);
    assert(stuRes.status === 200 && Array.isArray(stuRes.data.students), 'Teacher student progress list retrieved');

    const newNotice = await postJSON(
      `${BASE_URL}/api/v1/teacher/notices`,
      {
        title: 'Production Verification Notice ' + Date.now(),
        content: 'This is an automated production test notice.',
        category: 'Examination',
        priority: 'high'
      },
      teacherHeaders
    );
    assert(newNotice.status === 201 && newNotice.data.notice, 'Teacher publishes priority notice');

    // 6. Admin Workflows
    console.log('\n--- 6. Admin Core Services & Governance ---');
    const statsRes = await getJSON(`${BASE_URL}/api/v1/admin/stats`, adminHeaders);
    assert(statsRes.status === 200 && statsRes.data.stats, 'Admin retrieves system stats');

    const aiUsageRes = await getJSON(`${BASE_URL}/api/v1/admin/ai-usage`, adminHeaders);
    assert(aiUsageRes.status === 200 && Array.isArray(aiUsageRes.data.featureBreakdown), 'Admin retrieves AI usage metrics');

    const auditRes = await getJSON(`${BASE_URL}/api/v1/admin/audit-logs`, adminHeaders);
    assert(auditRes.status === 200 && Array.isArray(auditRes.data.logs), 'Admin retrieves audit event logs');

    const usersRes = await getJSON(`${BASE_URL}/api/v1/admin/users`, adminHeaders);
    assert(usersRes.status === 200 && Array.isArray(usersRes.data.users), 'Admin retrieves user management roster');

    // 7. AI Live Agent Chatbot Verification
    console.log('\n--- 7. AI Student Support Agent Chatbot ---');
    const chatRes = await postJSON(
      `${BASE_URL}/api/v1/chat/message`,
      { message: 'What is my current attendance percentage?' },
      studentHeaders
    );
    const replyContent = chatRes.data.reply?.content || chatRes.data.reply;
    assert(
      chatRes.status === 200 && replyContent && replyContent.length > 0,
      'AI Chatbot returns live attendance response using tool calling'
    );
    if (replyContent) {
      console.log('🤖 AI Agent Live Response Snippet:\n' + String(replyContent).substring(0, 180) + '...\n');
    }

    console.log('====================================================');
    console.log(`🏁 TEST SUITE COMPLETED: ${results.passed} PASSED | ${results.failed} FAILED`);
    console.log('====================================================');

    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal Test Runner Error:', error.message);
    process.exit(1);
  }
}

runTests();
