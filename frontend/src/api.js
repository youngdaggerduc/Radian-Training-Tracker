const BASE = (import.meta.env.VITE_API_BASE || "") + "/api";
const TOKEN_KEY = "radian_token";

let _token = null;

export function setToken(t) {
  _token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  _token = null;
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(method, path, body, { noRedirect = false } = {}) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (_token) opts.headers["Authorization"] = `Bearer ${_token}`;
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + path, opts);

  if (res.status === 401 && !noRedirect) {
    clearToken();
    window.location.reload();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Auth — 401 throws naturally without redirect (wrong password / expired)
export const login  = (username, password) => request("POST", "/auth/login", { username, password }, { noRedirect: true });
export const getMe  = ()                   => request("GET",  "/auth/me",    undefined,              { noRedirect: true });

// Admin — users
export const listUsers      = ()              => request("GET",    "/admin/users");
export const createUser     = (data)          => request("POST",   "/admin/users",                data);
export const resetPassword  = (id, password)  => request("PATCH",  `/admin/users/${id}/password`, { password });
export const deleteUser     = (id)            => request("DELETE", `/admin/users/${id}`);

// Admin — courses
export const listCourses   = ()          => request("GET",    "/admin/courses");
export const createCourse  = (data)      => request("POST",   "/admin/courses",           data);
export const updateCourse  = (id, data)  => request("PATCH",  `/admin/courses/${id}`,     data);
export const deleteCourse  = (id)        => request("DELETE", `/admin/courses/${id}`);

// Own account
export const changeMyPassword = (currentPw, newPw) =>
  request("PATCH", "/auth/me/password", { current_password: currentPw, new_password: newPw });

// Protected data endpoints
export const fetchState    = ()          => request("GET",    "/state");
export const createLead    = (lead)      => request("POST",   "/leads",            lead);
export const updateLead    = (lead)      => request("PATCH",  `/leads/${lead.id}`, lead);
export const deleteLead    = (id)        => request("DELETE", `/leads/${id}`);
export const createTrainee = (trainee)   => request("POST",   "/trainees",               trainee);
export const updateTrainee = (trainee)   => request("PATCH",  `/trainees/${trainee.id}`, trainee);
export const deleteTrainee = (id)        => request("DELETE", `/trainees/${id}`);
