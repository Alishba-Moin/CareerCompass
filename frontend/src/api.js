const BASE = '/api';

/** Retrieve token from localStorage */
export function getToken() {
  return localStorage.getItem('cc_token');
}

/** Persist token to localStorage */
export function setToken(token) {
  if (token) localStorage.setItem('cc_token', token);
  else localStorage.removeItem('cc_token');
}

/**
 * Shared fetch wrapper: parses JSON, throws typed errors on failure.
 * Network-level failures (server offline) surface as fetch TypeError.
 */
async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (HTTP ${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Auth headers with Bearer token */
function authHeaders() {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ── Auth ──────────────────────────────────────────────────────────

/** POST /api/auth/login — email + password login */
export async function login(email, password) {
  return handle(
    await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  );
}

/** POST /api/auth/signup — create new student account */
export async function signup(studentData) {
  return handle(
    await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    })
  );
}

/** GET /api/auth/me — get current session's student + analysis */
export async function getMe() {
  return handle(
    await fetch(`${BASE}/auth/me`, {
      headers: authHeaders(),
    })
  );
}

/** POST /api/auth/logout */
export async function logout() {
  return handle(
    await fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    })
  );
}

// ── Students ──────────────────────────────────────────────────────

/** GET /api/students — all seeded students (switcher). */
export async function fetchStudents() {
  return handle(await fetch(`${BASE}/students`, { headers: authHeaders() }));
}

/** GET /api/students/:id — one student with skills + progress. */
export async function fetchStudent(id) {
  return handle(await fetch(`${BASE}/students/${id}`, { headers: authHeaders() }));
}

/** GET /api/students/:id/roadmap — fetch student's stored analysis + roadmap. */
export async function fetchStudentRoadmap(id) {
  return handle(await fetch(`${BASE}/students/${id}/roadmap`, { headers: authHeaders() }));
}

/** POST /api/coach/analyze — full multi-agent pipeline. */
export async function analyze(studentId, query) {
  return handle(
    await fetch(`${BASE}/coach/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ studentId, query }),
    })
  );
}

/** POST /api/progress/toggle — toggle task, get recalculated score. */
export async function toggleTask(studentId, taskId, status) {
  return handle(
    await fetch(`${BASE}/progress/toggle`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ studentId, taskId, status }),
    })
  );
}

/** PATCH /api/students/:id — update profile fields. */
export async function updateStudent(id, patch) {
  return handle(
    await fetch(`${BASE}/students/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(patch),
    })
  );
}
