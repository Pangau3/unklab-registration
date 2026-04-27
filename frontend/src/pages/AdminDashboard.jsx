import { useDeferredValue, useEffect, useState } from "react";
import {
  buildDocumentUrl,
  deleteStudent,
  fetchStudentDetail,
  fetchStudents,
  updateStudentStatus,
} from "../api";
import logoUnklab from "../assets/logo-unklab.png";
import DocumentLink from "../components/DocumentLink";
import LoadingPanel from "../components/LoadingPanel";
import { STATUS_FILTER_OPTIONS } from "../registrationConfig";
import { formatBirthDate, formatDate } from "../utils/formatters";
import {
  countStudents,
  createSummary,
  isImageDocument,
  isPDFDocument,
} from "../utils/students";

function AdminDashboard({ user, onLogout, onSessionExpired }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(createSummary());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionState, setActionState] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const payload = await fetchStudents();
      setStudents(payload.students);
      setSummary(payload.summary || countStudents(payload.students));
      setLastLoadedAt(new Date().toISOString());

      if (!selectedStudentId) {
        return;
      }

      const nextSelectedStudent = payload.students.find(
        (student) => student.id === selectedStudentId
      );

      if (!nextSelectedStudent) {
        setSelectedStudent(null);
        setSelectedStudentId(null);
        return;
      }

      setSelectedStudent((currentStudent) =>
        currentStudent
          ? {
              ...currentStudent,
              ...nextSelectedStudent,
            }
          : nextSelectedStudent
      );
    } catch (loadError) {
      if (loadError.status === 401) {
        onSessionExpired();
        return;
      }

      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectStudent(studentId) {
    setSelectedStudentId(studentId);
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const payload = await fetchStudentDetail(studentId);
      setSelectedStudent(payload.student);
    } catch (loadError) {
      if (loadError.status === 401) {
        onSessionExpired();
        return;
      }

      setDetailError(loadError.message);
      setSelectedStudent(null);
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleStatusUpdate(id, status) {
    setActionState(`${id}:${status}`);
    setError("");
    setDetailError("");
    setSuccess("");

    try {
      const payload = await updateStudentStatus(id, status);
      const nextStudents = students.map((student) =>
        student.id === id ? payload.student : student
      );

      setStudents(nextStudents);
      setSummary(countStudents(nextStudents));
      if (selectedStudentId === id) {
        setSelectedStudent(payload.student);
      }

      setSuccess(`Status ${payload.student.name} berhasil diubah menjadi ${status}.`);
    } catch (updateError) {
      if (updateError.status === 401) {
        onSessionExpired();
        return;
      }

      setError(updateError.message);
    } finally {
      setActionState("");
    }
  }

  async function handleDeleteStudent(student) {
    const confirmed = window.confirm(
      `Hapus data pendaftaran ${student.name}? Tindakan ini akan menghapus data pendaftar beserta dokumen yang sudah diunggah.`
    );

    if (!confirmed) {
      return;
    }

    setActionState(`${student.id}:delete`);
    setError("");
    setDetailError("");
    setSuccess("");

    try {
      const payload = await deleteStudent(student.id);
      const nextStudents = students.filter((entry) => entry.id !== student.id);

      setStudents(nextStudents);
      setSummary(countStudents(nextStudents));

      if (selectedStudentId === student.id) {
        closeDetailDrawer();
      }

      setSuccess(
        `Data pendaftar ${payload.studentName || student.name} berhasil dihapus.`
      );
    } catch (deleteError) {
      if (deleteError.status === 401) {
        onSessionExpired();
        return;
      }

      setError(deleteError.message);
    } finally {
      setActionState("");
    }
  }

  function closeDetailDrawer() {
    setSelectedStudent(null);
    setSelectedStudentId(null);
    setDetailError("");
  }

  const filteredStudents = students.filter((student) => {
    const normalizedQuery = deferredQuery.toLowerCase().trim();
    const matchesQuery =
      normalizedQuery === "" ||
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.email.toLowerCase().includes(normalizedQuery) ||
      student.program.toLowerCase().includes(normalizedQuery) ||
      student.phone.toLowerCase().includes(normalizedQuery) ||
      student.previousSchool.toLowerCase().includes(normalizedQuery);

    const matchesStatus = statusFilter === "All" || student.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="dashboard-shell">
      <div className="dashboard-glow dashboard-glow-left" />
      <div className="dashboard-glow dashboard-glow-right" />

      <div className="dashboard-header">
        <div className="dashboard-header-main">
          <div className="dashboard-brand-lockup">
            <div className="dashboard-brand-mark">
              <img
                alt="Logo Universitas Klabat"
                className="dashboard-brand-logo"
                src={logoUnklab}
              />
            </div>

            <div className="dashboard-brand-copy">
              <div className="dashboard-kicker-row">
                <span className="eyebrow dashboard-eyebrow">Portal Admin</span>
                <span className="dashboard-session-pill">Sesi aktif</span>
              </div>
              <h2>Kelola approval pendaftar</h2>
              <p>
                Login sebagai {user.username}. Review dokumen, ubah status, dan
                pantau antrean verifikasi dalam satu dashboard administrasi.
              </p>
            </div>
          </div>

          <div className="dashboard-headline-grid">
            <div className="dashboard-note-card emphasis">
              <span>Antrean prioritas</span>
              <strong>{summary.pending}</strong>
              <small>Pendaftar masih menunggu keputusan admin.</small>
            </div>

            <div className="dashboard-note-card">
              <span>Terakhir sinkron</span>
              <strong>{lastLoadedAt ? formatDate(lastLoadedAt) : "-"}</strong>
              <small>Refresh kapan saja setelah ada perubahan status.</small>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <button className="secondary-button" onClick={loadStudents} type="button">
            Refresh
          </button>
          <button className="ghost-button" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <SummaryCard
          description="Seluruh pendaftar yang tercatat dalam sistem."
          label="Total pendaftar"
          value={summary.total}
          variant="total"
        />
        <SummaryCard
          description="Masih perlu review dan keputusan admin."
          label="Pending"
          value={summary.pending}
          variant="pending"
        />
        <SummaryCard
          description="Sudah disetujui dan lolos tahap verifikasi."
          label="Approved"
          value={summary.approved}
          variant="approved"
        />
        <SummaryCard
          description="Ditolak atau perlu tindak lanjut dokumen."
          label="Rejected"
          value={summary.rejected}
          variant="rejected"
        />
      </div>

      <div className="toolbar-card dashboard-filter-card">
        <div className="dashboard-panel-copy">
          <span className="dashboard-panel-kicker">Pusat Kontrol</span>
          <h3>Temukan data yang perlu ditindak</h3>
          <p>
            Cari lintas nama, email, program, nomor HP, atau asal sekolah lalu
            sempitkan hasil berdasarkan status untuk mempercepat review.
          </p>
        </div>

        <div className="toolbar">
          <div className="toolbar-field">
            <label htmlFor="search">Cari pendaftar</label>
            <div className="toolbar-input-shell">
              <span aria-hidden="true" className="toolbar-input-icon">
                <svg
                  fill="none"
                  height="18"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </span>
              <input
                id="search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, email, program, nomor HP, atau sekolah"
                type="search"
                value={query}
              />
            </div>
          </div>

          <div className="toolbar-field narrow">
            <label htmlFor="status-filter">Filter status</label>
            <div className="toolbar-select-shell">
              <select
                id="status-filter"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {success ? <p className="feedback success">{success}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      {isLoading ? (
        <LoadingPanel label="Mengambil data pendaftar..." />
      ) : (
        <div className="table-card data-table-card">
          <div className="data-table-header">
            <div>
              <span className="dashboard-panel-kicker">Antrian Pendaftar</span>
              <h3>{filteredStudents.length} data sedang ditampilkan</h3>
            </div>

            <div className="data-table-meta">
              <span className="data-table-chip">Total {summary.total}</span>
              <span className="data-table-chip pending">Pending {summary.pending}</span>
              <span className="data-table-chip approved">Approved {summary.approved}</span>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Pendaftar</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Dokumen</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length ? (
                  filteredStudents.map((student) => (
                    <tr
                      className={selectedStudentId === student.id ? "is-selected" : ""}
                      key={student.id}
                    >
                      <td>
                        <div className="student-identity">
                          <div
                            aria-hidden="true"
                            className={`student-avatar ${student.status.toLowerCase()}`}
                          >
                            {getInitials(student.name)}
                          </div>

                          <div className="student-cell">
                            <strong>{student.name}</strong>
                            <span>{student.email}</span>
                            <span className="muted-text">
                              Dikirim {formatDate(student.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{student.program}</td>
                      <td>
                        <span className={`status-pill ${student.status.toLowerCase()}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <div className="document-links">
                          <DocumentLink document={student.documents.photo} label="Foto" />
                          <DocumentLink document={student.documents.ktp} label="KTP" />
                          <DocumentLink document={student.documents.ijazah} label="Ijazah" />
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="secondary-button small-button"
                            onClick={() => handleSelectStudent(student.id)}
                            type="button"
                          >
                            Detail
                          </button>
                          <button
                            className="approve-button small-button"
                            disabled={
                              actionState === `${student.id}:Approved` ||
                              student.status === "Approved"
                            }
                            onClick={() => handleStatusUpdate(student.id, "Approved")}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="reject-button small-button"
                            disabled={
                              actionState === `${student.id}:Rejected` ||
                              student.status === "Rejected"
                            }
                            onClick={() => handleStatusUpdate(student.id, "Rejected")}
                            type="button"
                          >
                            Reject
                          </button>
                          <button
                            className="delete-button small-button"
                            disabled={actionState === `${student.id}:delete`}
                            onClick={() => handleDeleteStudent(student)}
                            type="button"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        Tidak ada data yang cocok dengan filter saat ini.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedStudentId ? <div className="drawer-backdrop" onClick={closeDetailDrawer} /> : null}

      <aside className={`detail-drawer ${selectedStudentId ? "is-open" : ""}`}>
        <div className="detail-header">
          <div>
            <span className="eyebrow">Detail Pendaftaran</span>
            <h3>Review data mahasiswa</h3>
          </div>
          <button
            className="ghost-button small-button"
            onClick={closeDetailDrawer}
            type="button"
          >
            Tutup
          </button>
        </div>

        {detailError ? <p className="feedback error">{detailError}</p> : null}

        {isDetailLoading ? (
          <LoadingPanel label="Mengambil detail pendaftaran..." />
        ) : selectedStudent ? (
          <StudentDetailPanel
            actionState={actionState}
            onDeleteStudent={handleDeleteStudent}
            onStatusUpdate={handleStatusUpdate}
            student={selectedStudent}
          />
        ) : (
          <div className="detail-empty">
            <strong>Pilih satu pendaftar</strong>
            <p>
              Klik tombol <em>Detail</em> pada tabel untuk melihat dokumen,
              metadata pendaftaran, dan aksi approval di panel ini.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}

function StudentDetailPanel({ actionState, onDeleteStudent, onStatusUpdate, student }) {
  const documents = [
    { key: "photo", label: "Foto", ...student.documents.photo },
    { key: "ktp", label: "KTP", ...student.documents.ktp },
    { key: "ijazah", label: "Ijazah", ...student.documents.ijazah },
  ];
  const availableDocuments = documents.filter((document) => document.url);
  const [activeDocumentKey, setActiveDocumentKey] = useState("");

  useEffect(() => {
    setActiveDocumentKey(availableDocuments[0]?.key || "");
  }, [student.id]);

  const activeDocument =
    availableDocuments.find((document) => document.key === activeDocumentKey) ||
    availableDocuments[0] ||
    null;

  return (
    <div className="detail-stack">
      <div className="detail-summary">
        <div className="student-cell">
          <strong>{student.name}</strong>
          <span>{student.email}</span>
        </div>
        <span className={`status-pill ${student.status.toLowerCase()}`}>
          {student.status}
        </span>
      </div>

      <div className="detail-meta">
        <DetailItem label="Program studi" value={student.program} />
        <DetailItem label="ID pendaftar" value={`#${student.id}`} />
        <DetailItem label="Nomor HP" value={student.phone} />
        <DetailItem label="Tanggal lahir" value={formatBirthDate(student.birthDate)} />
        <DetailItem label="Asal sekolah" value={student.previousSchool} />
        <DetailItem label="Dikirim pada" value={formatDate(student.createdAt)} />
      </div>

      <DetailItem className="detail-item-wide" label="Alamat" value={student.address} />

      <div className="helper-card">
        <strong>Kelengkapan dokumen</strong>
        <div className="document-checklist">
          {documents.map((document) => (
            <div className="document-check-item" key={document.key}>
              <span>{document.label}</span>
              <span className={document.url ? "doc-available" : "doc-missing"}>
                {document.url ? "Tersedia" : "Belum ada"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="helper-card document-preview-card">
        <div className="document-preview-header">
          <strong>Preview dokumen</strong>
          {activeDocument ? (
            <a
              className="secondary-button small-button"
              href={buildDocumentUrl(activeDocument.url)}
              rel="noreferrer"
              target="_blank"
            >
              Buka file
            </a>
          ) : null}
        </div>

        {availableDocuments.length ? (
          <>
            <div className="document-preview-tabs">
              {availableDocuments.map((document) => (
                <button
                  className={`preview-tab ${activeDocument?.key === document.key ? "is-active" : ""}`}
                  key={document.key}
                  onClick={() => setActiveDocumentKey(document.key)}
                  type="button"
                >
                  {document.label}
                </button>
              ))}
            </div>

            <div className="document-preview-shell">
              {isImageDocument(activeDocument) ? (
                <img
                  alt={`Preview ${activeDocument.label}`}
                  className="document-preview-image"
                  src={buildDocumentUrl(activeDocument.url)}
                />
              ) : isPDFDocument(activeDocument) ? (
                <iframe
                  className="document-preview-frame"
                  src={buildDocumentUrl(activeDocument.url)}
                  title={`Preview ${activeDocument.label}`}
                />
              ) : (
                <div className="detail-empty">
                  <strong>Preview tidak tersedia</strong>
                  <p>Jenis file ini hanya bisa dibuka di tab terpisah.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <span className="muted-text">Tidak ada dokumen yang bisa dipreview.</span>
        )}
      </div>

      <div className="detail-actions">
        <button
          className="approve-button"
          disabled={actionState === `${student.id}:Approved` || student.status === "Approved"}
          onClick={() => onStatusUpdate(student.id, "Approved")}
          type="button"
        >
          Approve
        </button>
        <button
          className="reject-button"
          disabled={actionState === `${student.id}:Rejected` || student.status === "Rejected"}
          onClick={() => onStatusUpdate(student.id, "Rejected")}
          type="button"
        >
          Reject
        </button>
        <button
          className="secondary-button"
          disabled={actionState === `${student.id}:Pending` || student.status === "Pending"}
          onClick={() => onStatusUpdate(student.id, "Pending")}
          type="button"
        >
          Kembalikan ke Pending
        </button>
        <button
          className="delete-button"
          disabled={actionState === `${student.id}:delete`}
          onClick={() => onDeleteStudent(student)}
          type="button"
        >
          Hapus Pendaftaran
        </button>
      </div>
    </div>
  );
}

function DetailItem({ className, label, value }) {
  return (
    <div className={className ? `detail-item ${className}` : "detail-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryCard({ description, label, value, variant }) {
  return (
    <div className={`summary-card ${variant || ""}`.trim()}>
      <div className="summary-card-top">
        <span>{label}</span>
        <span aria-hidden="true" className="summary-card-accent" />
      </div>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default AdminDashboard;
