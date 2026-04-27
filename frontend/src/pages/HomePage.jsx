import TransitionLink from "../components/TransitionLink";
import { PROGRAMS, REGISTRATION_DOCUMENTS } from "../registrationConfig";

const HOME_FEATURES = [
  {
    title: "Portal terpadu",
    description:
      "Informasi pendaftaran, pilihan program studi, dan persyaratan utama tersedia dalam satu portal.",
  },
  {
    title: "Proses jelas",
    description:
      "Setiap tahap dijelaskan secara sederhana agar calon mahasiswa tahu apa yang perlu disiapkan.",
  },
  {
    title: "Verifikasi tertata",
    description:
      "Setelah formulir dikirim, berkas akan masuk ke proses verifikasi internal kampus.",
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
      "Tim administrasi akan memeriksa kelengkapan dan keabsahan berkas yang telah dikirim.",
  },
  {
    number: "04",
    title: "Tunggu hasil verifikasi",
    description:
      "Keputusan pendaftaran akan diproses sesuai hasil review terhadap data dan dokumen.",
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

function HomePage() {
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
      value: `${HOME_STEPS.length}`,
      label: "Langkah Utama",
    },
  ];

  return (
    <div className="home-showcase">
      <section className="showcase-hero">
        <div className="showcase-copy">
          <span className="showcase-badge">Portal Pendaftaran Mahasiswa Baru</span>
          <h1>
            Pendaftaran mahasiswa baru <span>Universitas Klabat</span> dimulai
            dari sini.
          </h1>
          <span aria-hidden="true" className="showcase-divider" />
          <p>
            Dapatkan informasi penting, siapkan dokumen yang dibutuhkan, lalu
            kirim pendaftaran secara online melalui satu portal resmi.
          </p>

          <div className="showcase-actions single">
            <TransitionLink className="primary-button" to="/register">
              Daftar Sekarang
            </TransitionLink>
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
                <span>Gelombang pendaftaran aktif</span>
                <strong>Penerimaan mahasiswa baru Universitas Klabat</strong>
                <p>
                  Calon mahasiswa dapat mengisi data, mengunggah dokumen, dan
                  mengikuti proses pendaftaran secara online.
                </p>
              </div>

              <div className="showcase-preview-grid">
                <div className="showcase-preview-card wide accent">
                  <span>Langkah 1</span>
                  <strong>Lengkapi biodata dan pilih program studi</strong>
                </div>
                <div className="showcase-preview-card">
                  <span>Langkah 2</span>
                  <strong>Unggah dokumen utama</strong>
                </div>
                <div className="showcase-preview-card">
                  <span>Review</span>
                  <strong>Verifikasi terpusat</strong>
                </div>
                <div className="showcase-preview-card wide muted">
                  <span>Hasil verifikasi</span>
                  <strong>Berkas diproses lebih lanjut setelah seluruh dokumen dinyatakan lengkap</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase-section intro-section" id="tentang">
        <div className="showcase-section-copy">
          <span className="showcase-badge light">Tentang Portal</span>
          <h2>Portal ini membantu calon mahasiswa menyiapkan seluruh proses pendaftaran.</h2>
          <p>
            Mulai dari memilih program studi, menyiapkan dokumen wajib, hingga
            mengirim formulir secara online, semua informasi tersedia dalam
            satu tempat.
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
          <h2>Ikuti empat langkah sederhana untuk menyelesaikan pendaftaran online.</h2>
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
          <h2>Berbagai pilihan program studi tersedia untuk calon mahasiswa baru.</h2>
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
          <h2>Siapkan dokumen utama sejak awal agar proses pendaftaran berjalan lancar.</h2>
          <div className="document-prep-list">
            {REQUIRED_DOCUMENTS.map((document) => (
              <div className="document-prep-item" key={document.label}>
                <strong>{document.label}</strong>
                <span>{document.detail}</span>
              </div>
            ))}
          </div>

          <div className="showcase-actions single">
            <TransitionLink className="primary-button" to="/register">
              Daftar Sekarang
            </TransitionLink>
          </div>
        </article>
      </section>
    </div>
  );
}

export default HomePage;
