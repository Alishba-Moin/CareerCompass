const BASE = '/api';

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

/** GET /api/students — all seeded students (switcher). */
export async function fetchStudents() {
  return handle(await fetch(`${BASE}/students`));
}

/** GET /api/students/:id — one student with skills + progress. */
export async function fetchStudent(id) {
  return handle(await fetch(`${BASE}/students/${id}`));
}

/** POST /api/coach/analyze — full multi-agent pipeline. */
export async function analyze(studentId, query) {
  return handle(
    await fetch(`${BASE}/coach/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, query }),
    })
  );
}

/** POST /api/progress/toggle — toggle task, get recalculated score. */
export async function toggleTask(studentId, taskId, status) {
  return handle(
    await fetch(`${BASE}/progress/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, taskId, status }),
    })
  );
}

/** PATCH /api/students/:id — update profile fields. */
export async function updateStudent(id, patch) {
  return handle(
    await fetch(`${BASE}/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  );
}
