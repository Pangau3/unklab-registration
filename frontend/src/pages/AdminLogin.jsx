import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api";
import {
  clearFieldError,
  createEmptyLoginForm,
  validateLoginForm,
} from "../utils/forms";

function AdminLogin({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(createEmptyLoginForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    clearFieldError(name, setFieldErrors);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await loginAdmin(form);
      onLogin(payload.user);
      navigate("/admin", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
      setFieldErrors(submitError.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div aria-hidden="true" className="login-icon-wrap">
          <svg
            fill="none"
            height="26"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
            width="26"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" x2="3" y1="12" y2="12" />
          </svg>
        </div>

        <h1 className="login-title">Masuk sebagai Admin</h1>
        <p className="login-subtitle">
          Kelola dan verifikasi dokumen pendaftaran mahasiswa baru Universitas Klabat.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field-wrap">
            <div className={`login-input-group ${fieldErrors.username ? "has-error" : ""}`}>
              <span className="login-input-icon">
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                className="login-input"
                name="username"
                onChange={handleChange}
                placeholder="Username"
                type="text"
                value={form.username}
              />
            </div>
            {fieldErrors.username ? (
              <span className="login-field-error">{fieldErrors.username}</span>
            ) : null}
          </div>

          <div className="login-field-wrap">
            <div className={`login-input-group ${fieldErrors.password ? "has-error" : ""}`}>
              <span className="login-input-icon">
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                className="login-input"
                name="password"
                onChange={handleChange}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
              />
              <button
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="login-toggle-pw"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? (
                  <svg
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" x2="23" y1="1" y2="23" />
                  </svg>
                ) : (
                  <svg
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="16"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <span className="login-field-error">{fieldErrors.password}</span>
            ) : null}
          </div>

          {error ? <p className="login-error-msg">{error}</p> : null}

          <button className="login-submit-btn" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="login-footer-note">Universitas Klabat - Portal Administrasi</p>
      </div>
    </div>
  );
}

export default AdminLogin;
