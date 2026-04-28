const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

class APIError extends Error {
  constructor(message, { status, fields, payload } = {}) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.fields = fields || {};
    this.payload = payload;
  }
}

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(buildApiUrl(path), {
      credentials: "include",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new APIError("Gagal terhubung ke server. Pastikan backend Go sedang berjalan.");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new APIError(payload?.error || "Permintaan gagal diproses.", {
      status: response.status,
      fields: payload?.fields,
      payload,
    });
  }

  return payload;
}

export async function registerStudent(formData) {
  return request("/api/students/register", {
    method: "POST",
    body: formData,
  });
}

export async function checkRegistrationStatus(email, studentId) {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  if (studentId) params.set("id", studentId);
  return request(`/api/students/status?${params.toString()}`);
}

export async function loginAdmin(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function logoutAdmin() {
  return request("/api/auth/logout", {
    method: "POST",
  });
}

export async function fetchCurrentAdmin() {
  return request("/api/auth/me");
}

export async function fetchStudents() {
  return request("/api/admin/students");
}

export async function fetchStudentDetail(id) {
  return request(`/api/admin/students/${id}`);
}

export async function updateStudentStatus(id, status) {
  return request(`/api/admin/students/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteStudent(id) {
  return request(`/api/admin/students/${id}`, {
    method: "DELETE",
  });
}

export async function changeAdminPassword(currentPassword, newPassword) {
  return request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function bulkUpdateStudentStatus(ids, status) {
  return request("/api/admin/students/bulk-status", {
    method: "PATCH",
    body: JSON.stringify({ ids, status }),
  });
}

export async function exportStudentsCSV() {
  const url = buildApiUrl("/api/admin/students/export");
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new APIError("Gagal mengexport data.");
  return response.blob();
}

export function buildDocumentUrl(path) {
  return buildApiUrl(path);
}

export { APIError };
