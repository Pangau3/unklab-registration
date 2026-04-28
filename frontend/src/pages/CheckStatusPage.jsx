import { useState } from "react";
import { checkRegistrationStatus } from "../api";
import TransitionLink from "../components/TransitionLink";
import { formatDate } from "../utils/formatters";

function CheckStatusPage() {
  const [form, setForm] = useState({ email: "", studentId: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!form.email.trim() && !form.studentId.trim()) {
      setError("Masukkan email atau ID pendaftar untuk memeriksa status.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = await checkRegistrationStatus(form.email.trim(), form.studentId.trim());
      setResult(payload.student);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="check-status-dashboard">
      <section className="check-status-hero">
        <div className="check-status-hero-copy">
          <TransitionLink className="register-back-link" to="/">
            Kembali ke Beranda
          </TransitionLink>
          <span className="eyebrow check-status-badge">Cek Status Pendaftaran</span>
          <h1>
            Periksa status <span>pendaftaranmu</span>.
          </h1>
          <span aria-hidden="true" className="register-hero-divider" />
          <p>
            Masukkan email yang digunakan saat pendaftaran atau ID pendaftar
            untuk melihat status verifikasi dokumen kamu secara real-time.
          </p>
        </div>
      </section>

      <section className="check-status-content">
        <form className="check-status-form" onSubmit={handleSubmit}>
          <div className="check-status-form-header">
            <span className="eyebrow">Identifikasi Pendaftar</span>
            <h2>Masukkan data untuk mencari status pendaftaran.</h2>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <strong>Cari dengan email atau ID pendaftar</strong>
              <span>Gunakan salah satu atau keduanya untuk hasil yang lebih akurat.</span>
            </div>

            <div className="form-row two-column">
              <div className="field">
                <label className="field-label">Email pendaftaran</label>
                <input
                  name="email"
                  onChange={handleChange}
                  placeholder="email@example.com"
                  type="email"
                  value={form.email}
                />
              </div>

              <div className="field">
                <label className="field-label">ID pendaftar</label>
                <input
                  name="studentId"
                  onChange={handleChange}
                  placeholder="Contoh: 12"
                  type="text"
                  value={form.studentId}
                />
              </div>
            </div>
          </div>

          {error ? <p className="feedback error">{error}</p> : null}

          <button className="primary-button" disabled={isLoading} type="submit">
            {isLoading ? "Mencari..." : "Cek Status"}
          </button>
        </form>

        {result ? (
          <div className="check-status-result">
            <div className="check-status-result-header">
              <div>
                <span className="eyebrow">Hasil Pencarian</span>
                <h3>{result.name}</h3>
              </div>
              <span className={`status-pill ${result.status.toLowerCase()}`}>
                {result.status}
              </span>
            </div>

            <div className="check-status-meta">
              <CheckStatusItem label="Email" value={result.email} />
              <CheckStatusItem label="Program Studi" value={result.program} />
              <CheckStatusItem label="ID Pendaftar" value={`#${result.id}`} />
              <CheckStatusItem label="Tanggal Daftar" value={formatDate(result.createdAt)} />
            </div>

            <div className={`check-status-explanation ${result.status.toLowerCase()}`}>
              {result.status === "Pending" && (
                <>
                  <strong>⏳ Pendaftaran sedang dalam proses review</strong>
                  <p>
                    Tim administrasi sedang memverifikasi kelengkapan dan keabsahan dokumen yang
                    telah kamu unggah. Proses ini biasanya membutuhkan waktu 3–7 hari kerja.
                  </p>
                </>
              )}
              {result.status === "Approved" && (
                <>
                  <strong>✅ Pendaftaran telah disetujui</strong>
                  <p>
                    Selamat! Dokumen pendaftaranmu telah diverifikasi dan disetujui. Silakan
                    menunggu informasi selanjutnya melalui email.
                  </p>
                </>
              )}
              {result.status === "Rejected" && (
                <>
                  <strong>❌ Pendaftaran ditolak</strong>
                  <p>
                    Mohon maaf, pendaftaranmu belum bisa diproses lebih lanjut. Silakan hubungi
                    bagian administrasi untuk informasi lebih detail.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CheckStatusItem({ label, value }) {
  return (
    <div className="check-status-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default CheckStatusPage;
