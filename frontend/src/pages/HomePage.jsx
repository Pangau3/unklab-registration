import { Link } from "react-router-dom";
import { PROGRAMS, REGISTRATION_DOCUMENTS } from "../registrationConfig";

const HOME_FEATURES = [
  {
    title: "Portal terpadu",
    description:
      "Satu halaman untuk pengenalan kampus, pendaftaran mahasiswa, dan verifikasi admin.",
  },
  {
    title: "Proses jelas",
    description:
      "Alur registrasi dibuat bertahap agar calon mahasiswa memahami langkah yang harus disiapkan.",
  },
  {
    title: "Review lebih cepat",
    description:
      "Admin dapat membuka detail pendaftar, memeriksa dokumen, lalu mengubah status langsung dari dashboard.",
  },
];

const HOME_STEPS = [
  {
    number: "01",
    title: "Lengkapi data awal",
    description:
      "Masukkan nama lengkap, email aktif, dan pilih program studi yang tersedia.",
  },
  {
    number: "02",
    title: "Unggah dokumen",
    description:
      "Siapkan foto, KTP, dan ijazah dengan format yang sesuai agar validasi berjalan lancar.",
  },
  {
    number: "03",
    title: "Tunggu verifikasi",
    description:
      "Sistem menyimpan data ke database lokal, lalu admin memeriksa kelengkapan dan keabsahan berkas.",
  },
  {
    number: "04",
    title: "Pantau hasil approval",
    description:
      "Status pendaftaran akan diproses sebagai Pending, Approved, atau Rejected sesuai hasil review.",
  },
];

const REQUIRED_DOCUMENTS = [
  {
    label: "Foto formal",
    detail: REGISTRATION_DOCUMENTS.photo.helpText.replace("Wajib diunggah. ", ""),
  },
  {
    label: "Kartu Tanda Penduduk",
    detail: REGISTRATION_DOCUMENTS.ktp.helpText.replace("Wajib diunggah. ", ""),
  },
  {
    label: "Ijazah terakhir",
    detail: REGISTRATION_DOCUMENTS.ijazah.helpText.replace("Wajib diunggah. ", ""),
  },
];

function HomePage({ isAdminAuthenticated }) {
  const homeMetrics = [
    {
      value: `${PROGRAMS.length}+`,
      label: "Program Studi",
    },
    {
      value: `${REQUIRED_DOCUMENTS.length}`,
      label: "Dokumen Utama",
    },
    {
      value: "1",
      label: "Dashboard Admin",
    },
  ];

  return (
    <div className="home-showcase">
      <section className="showcase-hero">
        <div className="showcase-copy">
          <span className="showcase-badge">Portal Pendaftaran Mahasiswa Baru</span>
          <h1>
            <span>Portal</span> pendaftaran mahasiswa baru Universitas Klabat.
          </h1>
          <p>
            Jelajahi informasi utama, siapkan dokumen yang diperlukan, lalu
            lanjut ke formulir pendaftaran dari satu halaman yang rapi dan
            mudah dipahami.
          </p>

          <div className="showcase-actions">
            <Link className="primary-button" to="/register">
              Daftar Sekarang
            </Link>
          </div>

          <div className="showcase-metrics">
            {homeMetrics.map((metric) => (
              <div className="showcase-metric" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="showcase-media">
          <div className="showcase-window">
            <div className="showcase-window-bar">
              <span />
              <span />
              <span />
            </div>

            <div className="showcase-window-body">
              <div className="showcase-window-banner">
                <span>Gelombang pendaftaran</span>
                <strong>Tahun Akademik Baru</strong>
              </div>

              <div className="showcase-preview-grid">
                <div className="showcase-preview-card wide">
                  <span>Langkah 1</span>
                  <strong>Lengkapi data pendaftar</strong>
                </div>
                <div className="showcase-preview-card">
                  <span>Langkah 2</span>
                  <strong>Unggah dokumen</strong>
                </div>
                <div className="showcase-preview-card">
                  <span>Status</span>
                  <strong>Pending</strong>
                </div>
                <div className="showcase-preview-card wide muted">
                  <span>Dashboard admin</span>
                  <strong>Review dan approval langsung</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase-section intro-section" id="tentang">
        <div className="showcase-section-copy">
          <span className="showcase-badge light">Tentang Portal</span>
          <h2>Struktur homepage dibuat lebih ringan, formal, dan mudah dipahami.</h2>
          <p>
            Arah desain ini mengikuti gaya landing page modern: headline besar,
            ruang kosong yang lega, CTA yang jelas, dan section lanjutan yang
            tetap informatif untuk calon mahasiswa maupun admin.
          </p>
        </div>

        <div className="pillar-grid">
          {HOME_FEATURES.map((feature) => (
            <article className="pillar-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-section workflow-section" id="cara-kerja">
        <div className="showcase-section-copy compact">
          <span className="showcase-badge light">Cara Kerja</span>
          <h2>Alur pendaftaran tetap ringkas, tapi terlihat lebih terstruktur.</h2>
        </div>

        <div className="workflow-grid">
          {HOME_STEPS.map((step) => (
            <article className="workflow-card" key={step.number}>
              <span className="workflow-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-section info-panels">
        <article className="program-panel" id="program">
          <span className="showcase-badge light">Program Studi</span>
          <h2>Pilihan program tersedia langsung di formulir pendaftaran.</h2>
          <div className="program-list">
            {PROGRAMS.map((program) => (
              <div className="program-list-item" key={program}>
                <strong>{program}</strong>
                <span>Pendaftaran dibuka melalui sistem online.</span>
              </div>
            ))}
          </div>
        </article>

        <article className="document-panel" id="dokumen">
          <span className="showcase-badge light">Dokumen Wajib</span>
          <h2>Semua berkas utama dijelaskan sejak awal agar calon mahasiswa siap.</h2>
          <div className="document-prep-list">
            {REQUIRED_DOCUMENTS.map((document) => (
              <div className="document-prep-item" key={document.label}>
                <strong>{document.label}</strong>
                <span>{document.detail}</span>
              </div>
            ))}
          </div>

          <div className="showcase-actions">
            <Link className="primary-button" to="/register">
              Buka Formulir
            </Link>
            <Link className="ghost-button dark" to="/admin">
              {isAdminAuthenticated ? "Dashboard Admin" : "Masuk Admin"}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export default HomePage;
