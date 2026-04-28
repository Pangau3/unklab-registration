import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { fetchCurrentAdmin, logoutAdmin } from "./api";
import homeGate from "./assets/home-gate.jpg";
import logoUnklab from "./assets/logo-unklab.png";
import LoadingPanel from "./components/LoadingPanel";
import ScrollToHash from "./components/ScrollToHash";
import Toast from "./components/Toast";
import TransitionLink from "./components/TransitionLink";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import CheckStatusPage from "./pages/CheckStatusPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";

/* ─── Auth Context ──────────────────────────────────────────────── */
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

/* ─── Toast Context ─────────────────────────────────────────────── */
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const addToast = useCallback((message, variant = "success", duration = 4000) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} onClose={() => removeToast(toast.id)} variant={toast.variant} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── App ────────────────────────────────────────────────────────── */
function App() {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    isLoading: true,
    user: null,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHomeRoute = location.pathname === "/";
  const isRegisterRoute = location.pathname === "/register";
  const isCheckStatusRoute = location.pathname === "/check-status";
  const hasPublicChrome = !isAdminRoute && !isRegisterRoute && !isCheckStatusRoute;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;

    fetchCurrentAdmin()
      .then((payload) => {
        if (!active) return;
        setAuthState({ isLoading: false, user: payload.user });
      })
      .catch(() => {
        if (!active) return;
        setAuthState({ isLoading: false, user: null });
      });

    return () => {
      active = false;
    };
  }, []);

  const appShellClassName = `app-shell ${isHomeRoute ? "app-shell-home" : ""}`.trim();
  const appShellStyle = isHomeRoute
    ? { "--home-shell-image": `url(${homeGate})` }
    : undefined;

  const adminRouteElement = authState.isLoading ? (
    <LoadingPanel label="Memeriksa sesi admin..." />
  ) : authState.user ? (
    <AdminDashboard
      onLogout={async () => {
        await logoutAdmin();
        setAuthState({ isLoading: false, user: null });
      }}
      onSessionExpired={() => {
        setAuthState({ isLoading: false, user: null });
      }}
      user={authState.user}
    />
  ) : (
    <AdminLogin
      onLogin={(user) => {
        setAuthState({ isLoading: false, user });
      }}
    />
  );

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      <ToastProvider>
        <div className={appShellClassName} style={appShellStyle}>
          {hasPublicChrome ? (
            <header className={`topbar ${isHomeRoute ? "topbar-home" : ""}`.trim()}>
              <TransitionLink className={`brand ${isHomeRoute ? "brand-home" : ""}`.trim()} to="/">
                <img alt="Logo Universitas Klabat" className="brand-logo" src={logoUnklab} />
                <span className="brand-text">UNKLAB Registration</span>
              </TransitionLink>

              <button
                aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
                className={`mobile-menu-toggle ${isHomeRoute ? "mobile-menu-toggle-home" : ""} ${mobileMenuOpen ? "is-open" : ""}`.trim()}
                onClick={() => setMobileMenuOpen((v) => !v)}
                type="button"
              >
                <span />
                <span />
                <span />
              </button>

              <nav className={`topnav ${isHomeRoute ? "topnav-home" : ""} ${mobileMenuOpen ? "topnav-open" : ""}`.trim()}>
                <TransitionLink to="/">Beranda</TransitionLink>
                <TransitionLink to="/#tentang">Tentang</TransitionLink>
                <TransitionLink to="/#program">Program</TransitionLink>
                <TransitionLink to="/check-status">Cek Status</TransitionLink>
                <TransitionLink to="/register">Daftar Sekarang</TransitionLink>
              </nav>
            </header>
          ) : null}

          <main
            className={`page ${isHomeRoute ? "page-home" : ""} ${
              isAdminRoute ? "page-admin-login" : ""
            }`.trim()}
          >
            {isAdminRoute ? (
              <Routes>
                <Route path="/admin" element={adminRouteElement} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            ) : (
              <>
                <ScrollToHash />
                <div
                  className={`page-transition-shell ${isHomeRoute ? "page-transition-home" : ""}`.trim()}
                  key={location.pathname}
                >
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/check-status" element={<CheckStatusPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </>
            )}
          </main>

          {hasPublicChrome ? (
            <footer className={`site-footer ${isHomeRoute ? "site-footer-home" : ""}`.trim()}>
              <div className="footer-grid">
                <div className="footer-brand-col">
                  <div className="footer-brand">
                    <img alt="Logo UNKLAB" className="footer-brand-logo" src={logoUnklab} />
                    <strong>UNKLAB Registration</strong>
                  </div>
                  <div className="footer-highlights" aria-label="Fitur portal">
                    <span>Pendaftaran online</span>
                    <span>Upload dokumen</span>
                    <span>Pantau status</span>
                  </div>
                  <p>Portal pendaftaran mahasiswa baru Universitas Klabat — kampus Advent terbesar di Asia Tenggara.</p>
                </div>

                <div className="footer-contact-col">
                  <strong>Kontak Kampus</strong>
                  <span>Jl. Arnold Mononutu, Airmadidi</span>
                  <span>Kabupaten Minahasa Utara</span>
                  <span>Sulawesi Utara 95371</span>
                  <span>📞 (0431) 891035</span>
                  <span>✉️ admisi@unklab.ac.id</span>
                </div>
              </div>

              <div className="footer-bottom">
                <span>© {new Date().getFullYear()} Universitas Klabat. All rights reserved.</span>
              </div>
            </footer>
          ) : null}
        </div>
      </ToastProvider>
    </AuthContext.Provider>
  );
}

export default App;
