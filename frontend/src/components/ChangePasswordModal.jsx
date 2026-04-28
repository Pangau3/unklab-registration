import { useState } from "react";
import { changeAdminPassword } from "../api";

function ChangePasswordModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.currentPassword || !form.newPassword) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);

    try {
      await changeAdminPassword(form.currentPassword, form.newPassword);
      onSuccess("Password berhasil diubah.");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3>Ubah Password</h3>
          <p>Masukkan password lama dan password baru untuk memperbarui kredensial akun admin.</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Password saat ini</label>
            <input
              name="currentPassword"
              onChange={handleChange}
              placeholder="Masukkan password lama"
              type="password"
              value={form.currentPassword}
            />
          </div>

          <div className="field">
            <label className="field-label">Password baru</label>
            <input
              name="newPassword"
              onChange={handleChange}
              placeholder="Minimal 6 karakter"
              type="password"
              value={form.newPassword}
            />
          </div>

          <div className="field">
            <label className="field-label">Konfirmasi password baru</label>
            <input
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Ulangi password baru"
              type="password"
              value={form.confirmPassword}
            />
          </div>

          {error ? <p className="feedback error">{error}</p> : null}

          <div className="modal-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              Batal
            </button>
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
