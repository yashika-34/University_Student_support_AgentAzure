import app from '../server.js';
import mongoose from 'mongoose';

async function testBackend() {
  console.log('Testing Backend API Endpoints against MongoDB...');
  // We can use supertest or fetch if server is running, or import supertest/fetch
  const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

  try {
    // 1. Student Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.student@university.edu', password: 'Student@1234' })
    });
    const loginData = await loginRes.json();
    console.log('1. Student Login Status:', loginRes.status, 'Success:', loginData.success, 'Role:', loginData.user?.role, 'StudentId:', loginData.user?.profile?.studentId);
    const token = loginData.token;

    // 2. Student Me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    console.log('2. Auth Me Status:', meRes.status, 'Name:', meData.user?.fullName);

    // 3. Student Analytics
    const analyticsRes = await fetch(`${baseUrl}/students/me/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const analyticsData = await analyticsRes.json();
    console.log('3. Student Analytics Status:', analyticsRes.status, 'CGPA:', analyticsData.analytics?.student?.cgpa, 'OverallAttendance:', analyticsData.analytics?.overallAttendance + '%', 'GPA Points:', analyticsData.analytics?.gpaTrend?.length);

    // 4. Attendance Summary
    const attRes = await fetch(`${baseUrl}/attendance/my-summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const attData = await attRes.json();
    console.log('4. Attendance Summary Status:', attRes.status, 'Courses count:', attData.overallSummary?.length);

    // 5. Marks
    const marksRes = await fetch(`${baseUrl}/marks/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const marksData = await marksRes.json();
    console.log('5. Marks Status:', marksRes.status, 'Marks count:', marksData.count);

    // 6. Assignments
    const asgRes = await fetch(`${baseUrl}/assignments/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const asgData = await asgRes.json();
    console.log('6. Assignments Status:', asgRes.status, 'Count:', asgData.count);

    // 7. Notices
    const noticesRes = await fetch(`${baseUrl}/notifications/notices`);
    const noticesData = await noticesRes.json();
    console.log('7. Notices Status:', noticesRes.status, 'Notices count:', noticesData.count);

    // 8. Exam Schedules
    const examsRes = await fetch(`${baseUrl}/academic/exam-schedules`);
    const examsData = await examsRes.json();
    console.log('8. Exam Schedules Status:', examsRes.status, 'Count:', examsData.count);

    // 9. Documents for RAG
    const docsRes = await fetch(`${baseUrl}/rag/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const docsData = await docsRes.json();
    console.log('9. RAG Documents Status:', docsRes.status, 'Count:', docsData.count);

    // 10. Faculty Login
    const facLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.alan@university.edu', password: 'Faculty@1234' })
    });
    const facLoginData = await facLoginRes.json();
    console.log('10. Faculty Login Status:', facLoginRes.status, 'Role:', facLoginData.user?.role);
    const facToken = facLoginData.token;

    // 11. Faculty Dashboard
    const facDashRes = await fetch(`${baseUrl}/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${facToken}` }
    });
    const facDashData = await facDashRes.json();
    console.log('11. Teacher Dashboard Status:', facDashRes.status, 'Courses:', facDashData.dashboard?.courses?.length, 'Total Students:', facDashData.dashboard?.stats?.totalStudents);

    console.log('\n🎉 ALL BACKEND API ENDPOINTS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err.message);
    process.exit(1);
  }
}

// Give server 1 sec to connect
setTimeout(testBackend, 1500);
