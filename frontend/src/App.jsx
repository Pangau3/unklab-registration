import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { fetchCurrentAdmin, logoutAdmin } from "./api";
import homeGate from "./assets/home-gate.jpg";
import logoUnklab from "./assets/logo-unklab.png";
import LoadingPanel from "./components/LoadingPanel";
import ScrollToHash from "./components/ScrollToHash";
import TransitionLink from "./components/TransitionLink";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    isLoading: true,
    user: null,
  });
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHomeRoute = location.pathname === "/";
  const isRegisterRoute = location.pathname === "/register";
  const hasPublicChrome = !isAdminRoute && !isRegisterRoute;

  useEffect(() => {
    let active = true;

    fetchCurrentAdmin()
      .then((payload) => {
        if (!active) {
          return;
        }

        setAuthState({
          isLoading: false,
          user: payload.user,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setAuthState({
          isLoading: false,
          user: null,
        });
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
    <div className={appShellClassName} style={appShellStyle}>
      {hasPublicChrome ? (
        <header className={`topbar ${isHomeRoute ? "topbar-home" : ""}`.trim()}>
          <TransitionLink className={`brand ${isHomeRoute ? "brand-home" : ""}`.trim()} to="/">
            <img alt="Logo Universitas Klabat" className="brand-logo" src={logoUnklab} />
            <span className="brand-text">UNKLAB Registration</span>
          </TransitionLink>

          <nav className={`topnav ${isHomeRoute ? "topnav-home" : ""}`.trim()}>
            <TransitionLink to="/">Beranda</TransitionLink>
            <TransitionLink to="/#tentang">Tentang</TransitionLink>
            <TransitionLink to="/#program">Program</TransitionLink>
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </>
        )}
      </main>

      {hasPublicChrome ? (
        <footer className={`site-footer ${isHomeRoute ? "site-footer-home" : ""}`.trim()}>
          <span>Portal pendaftaran mahasiswa baru Universitas Klabat.</span>
        </footer>
      ) : null}
    </div>
  );
}

export default App;
