import { useState } from "react";
import { registerStudent } from "../api";
import FileMeta from "../components/FileMeta";
import FormField from "../components/FormField";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_HINTS,
  REGISTRATION_DOCUMENTS,
  PROGRAMS,
} from "../registrationConfig";
import {
  buildRegisterFormData,
  clearFieldError,
  createEmptyRegisterForm,
  validateRegisterForm,
} from "../utils/forms";

function RegisterPage() {
  const [form, setForm] = useState(createEmptyRegisterForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [message, setMessage] = useState("");
  const [submittedStudent, setSubmittedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    clearFieldError(name, setFieldErrors);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    const { name } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: file,
    }));
    clearFieldError(name, setFieldErrors);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setMessage("");
    setSubmittedStudent(null);

    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await registerStudent(buildRegisterFormData(form));
      setMessage(payload.message);
      setSubmittedStudent(payload.student);
      setFieldErrors({});
      setForm(createEmptyRegisterForm());
      setFormKey((currentKey) => currentKey + 1);
    } catch (error) {
      setSubmitError(error.message);
      setFieldErrors(error.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="content-grid register-layout">
      <article className="content-card accent-card register-aside">
        <span className="eyebrow">Student Registration</span>
        <h2>Lengkapi biodata, pilih program, lalu unggah berkas utama.</h2>
        <p>
          Form ini sudah dibagi menjadi beberapa bagian agar lebih mudah diisi.
          Validasi dilakukan di frontend dan backend sebelum data disimpan.
        </p>

        <div className="register-checklist">
          <div className="register-check-item">
            <strong>1. Biodata calon mahasiswa</strong>
            <span>Nama, email, nomor HP, alamat, asal sekolah, dan tanggal lahir.</span>
          </div>
          <div className="register-check-item">
            <strong>2. Program studi tujuan</strong>
            <span>Pilih salah satu program yang tersedia di portal pendaftaran.</span>
          </div>
          <div className="register-check-item">
            <strong>3. Dokumen wajib</strong>
            <span>Foto, KTP, dan ijazah terakhir dengan ukuran maksimal 5 MB.</span>
          </div>
        </div>

        <div className="helper-card">
          <strong>Dokumen wajib</strong>
          <ul className="plain-list">
            <li>Foto: {REGISTRATION_DOCUMENTS.photo.helpText.replace("Wajib diunggah. ", "")}</li>
            <li>KTP: {REGISTRATION_DOCUMENTS.ktp.helpText.replace("Wajib diunggah. ", "")}</li>
            <li>
              Ijazah: {REGISTRATION_DOCUMENTS.ijazah.helpText.replace("Wajib diunggah. ", "")}
            </li>
          </ul>
        </div>

        {submittedStudent ? (
          <div className="submitted-card">
            <strong>Pendaftaran terkirim</strong>
            <p>{submittedStudent.name}</p>
            <span>
              {submittedStudent.program} | {submittedStudent.phone}
            </span>
            <span className="status-pill pending">{submittedStudent.status}</span>
          </div>
        ) : null}
      </article>

      <form key={formKey} className="form-card register-form-card" onSubmit={handleSubmit}>
        <div className="register-form-header">
          <div>
            <span className="eyebrow">Formulir Pendaftaran</span>
            <h2>Isi semua field wajib sebelum mengirim pendaftaran.</h2>
          </div>
          <span className="register-required-note">Semua field bertanda wajib harus diisi.</span>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <strong>Data pribadi</strong>
            <span>Pastikan biodata sesuai dokumen resmi.</span>
          </div>

          <div className="form-row two-column">
            <FormField
              error={fieldErrors.name}
              helpText="Gunakan nama lengkap sesuai dokumen."
              label="Nama lengkap"
            >
              <input
                name="name"
                onChange={handleFieldChange}
                placeholder="Nama calon mahasiswa"
                type="text"
                value={form.name}
              />
            </FormField>

            <FormField error={fieldErrors.email} label="Email aktif">
              <input
                name="email"
                onChange={handleFieldChange}
                placeholder="email@example.com"
                type="email"
                value={form.email}
              />
            </FormField>
          </div>

          <div className="form-row two-column">
            <FormField error={fieldErrors.phone} label="Nomor HP">
              <input
                name="phone"
                onChange={handleFieldChange}
                placeholder="08xxxxxxxxxx"
                type="tel"
                value={form.phone}
              />
            </FormField>

            <FormField error={fieldErrors.birthDate} label="Tanggal lahir">
              <input
                name="birthDate"
                onChange={handleFieldChange}
                type="date"
                value={form.birthDate}
              />
            </FormField>
          </div>

          <FormField
            error={fieldErrors.address}
            helpText="Tuliskan alamat tempat tinggal saat ini."
            label="Alamat lengkap"
          >
            <textarea
              name="address"
              onChange={handleFieldChange}
              placeholder="Alamat lengkap calon mahasiswa"
              rows="4"
              value={form.address}
            />
          </FormField>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <strong>Data akademik</strong>
            <span>Informasi ini akan dipakai untuk proses seleksi awal.</span>
          </div>

          <div className="form-row two-column">
            <FormField error={fieldErrors.previousSchool} label="Asal sekolah">
              <input
                name="previousSchool"
                onChange={handleFieldChange}
                placeholder="Nama SMA / SMK / sekolah asal"
                type="text"
                value={form.previousSchool}
              />
            </FormField>

            <FormField error={fieldErrors.program} label="Program studi tujuan">
              <select name="program" onChange={handleFieldChange} value={form.program}>
                <option value="">Pilih program studi</option>
                {PROGRAMS.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <strong>Upload dokumen</strong>
            <span>Gunakan file yang jelas dan sesuai format.</span>
          </div>

          <div className="form-row two-column document-upload-grid">
            <FormField error={fieldErrors.photo} helpText={DOCUMENT_HINTS.photo} label="Foto">
              <input
                accept={DOCUMENT_ACCEPT.photo}
                name="photo"
                onChange={handleFileChange}
                type="file"
              />
              <FileMeta file={form.photo} />
            </FormField>

            <FormField error={fieldErrors.ktp} helpText={DOCUMENT_HINTS.ktp} label="KTP">
              <input
                accept={DOCUMENT_ACCEPT.ktp}
                name="ktp"
                onChange={handleFileChange}
                type="file"
              />
              <FileMeta file={form.ktp} />
            </FormField>

            <FormField error={fieldErrors.ijazah} helpText={DOCUMENT_HINTS.ijazah} label="Ijazah">
              <input
                accept={DOCUMENT_ACCEPT.ijazah}
                name="ijazah"
                onChange={handleFileChange}
                type="file"
              />
              <FileMeta file={form.ijazah} />
            </FormField>
          </div>
        </div>

        {message ? <p className="feedback success">{message}</p> : null}
        {submitError ? <p className="feedback error">{submitError}</p> : null}

        <div className="register-submit-row">
          <span className="register-submit-note">
            Setelah dikirim, status awal pendaftaran akan masuk sebagai Pending.
          </span>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Mengirim pendaftaran..." : "Kirim Pendaftaran"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default RegisterPage;
