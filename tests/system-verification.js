/**
 * System Verification & Automated Test Suite
 * University Maintenance Service Request System (MIT 8333)
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log(' 🧪 STARTING SYSTEM VERIFICATION & API TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ [FAIL] ${name}:`, error.message);
      failed++;
    }
  }

  // Helper for cookies
  let studentCookie = '';
  let adminCookie = '';
  let officerCookie = '';

  // 1. Test Unauthenticated Route Guard
  await test('Security: Unauthenticated API access rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/requests`);
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
  });

  // 2. Test Student Authentication
  await test('Auth: Student login with valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'student@miva.edu', password: 'student123' }),
    });
    if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) throw new Error('No session cookie returned');
    studentCookie = setCookie.split(';')[0];
  });

  // 3. Test Admin Authentication
  await test('Auth: Administrator login with valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'admin@miva.edu', password: 'admin123' }),
    });
    if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    adminCookie = setCookie.split(';')[0];
  });

  // 4. Test Officer Authentication
  await test('Auth: Maintenance Officer login with valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'officer@miva.edu', password: 'officer123' }),
    });
    if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    officerCookie = setCookie.split(';')[0];
  });

  // 5. Test Current User Profile Retrieval
  await test('Auth: /api/auth/me returns student session profile', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: studentCookie },
    });
    if (res.status !== 200) throw new Error(`Failed with status ${res.status}`);
    const data = await res.json();
    if (data.user.email !== 'student@miva.edu') throw new Error(`Unexpected user: ${data.user.email}`);
  });

  // 6. Test Service Request Submission (FormData / Multipart)
  let createdRequestId = null;
  await test('Requests: Student can submit new maintenance request', async () => {
    const formData = new FormData();
    formData.append('title', 'Water leakage under sink in Lab 102');
    formData.append('description', 'Pipe joint under the main sink is dripping steadily onto the cabinet.');
    formData.append('categoryId', '3'); // Leaking Pipes
    formData.append('priority', 'HIGH');

    const res = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
      body: formData,
    });

    if (res.status !== 201) throw new Error(`Creation failed with status ${res.status}`);
    const data = await res.json();
    createdRequestId = data.request.id;
    if (!createdRequestId) throw new Error('No request ID returned');
  });

  // 7. Test Student Request Listing Scope
  await test('Requests: Student lists own service complaints', async () => {
    const res = await fetch(`${BASE_URL}/api/requests`, {
      headers: { Cookie: studentCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.requests)) throw new Error('Expected requests array');
  });

  // 8. Test Admin Task Assignment to Officer
  await test('Assignments: Admin routes request to Maintenance Officer', async () => {
    const res = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        requestId: createdRequestId,
        officerId: 2, // Officer John Doe
      }),
    });
    if (res.status !== 200) throw new Error(`Assignment failed with status ${res.status}`);
  });

  // 9. Test Officer Status Transition (IN_PROGRESS & COMPLETED)
  await test('Workflow: Officer updates assigned ticket status to IN_PROGRESS', async () => {
    const res = await fetch(`${BASE_URL}/api/requests/${createdRequestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: officerCookie,
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        comment: 'Dispatched plumber to inspect sink joint.',
      }),
    });
    if (res.status !== 200) throw new Error(`Status update failed with status ${res.status}`);
  });

  await test('Workflow: Officer completes assigned maintenance ticket', async () => {
    const res = await fetch(`${BASE_URL}/api/requests/${createdRequestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: officerCookie,
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        comment: 'Replaced rubber washer and tightened joint. Water flow verified clean.',
      }),
    });
    if (res.status !== 200) throw new Error(`Status update failed with status ${res.status}`);
  });

  // 10. Test Admin Reports & Metrics JSON
  await test('Reports: Admin fetches metrics summary and breakdown', async () => {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      headers: { Cookie: adminCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (typeof data.summary.total !== 'number') throw new Error('Invalid metrics schema');
  });

  // 11. Test Admin CSV Report Export
  await test('Reports: Admin exports CSV spreadsheet report', async () => {
    const res = await fetch(`${BASE_URL}/api/reports?export=csv`, {
      headers: { Cookie: adminCookie },
    });
    if (res.status !== 200) throw new Error(`CSV export failed with status ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('text/csv')) throw new Error(`Expected text/csv content-type, got ${contentType}`);
    const csvText = await res.text();
    if (!csvText.startsWith('Request ID,Title,Description')) throw new Error('Invalid CSV header structure');
  });

  // 12. Test User Management API
  await test('Users: Admin lists system users', async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: adminCookie },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.users)) throw new Error('Expected users array');
  });

  console.log('\n====================================================');
  console.log(` 🏁 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
