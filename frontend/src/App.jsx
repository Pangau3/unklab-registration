import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { fetchCurrentAdmin, logoutAdmin } from "./api";
import logoUnklab from "./assets/logo-unklab.png";
import LoadingPanel from "./components/LoadingPanel";
import ScrollToHash from "./components/ScrollToHash";
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

  return (
    <div className="app-shell">
      {!isAdminRoute ? (
        <header className="topbar">
          <Link className="brand" to="/">
            <img alt="Logo Universitas Klabat" className="brand-logo" src={logoUnklab} />
            <span className="brand-text">UNKLAB Registration</span>
          </Link>

          <nav className="topnav">
            <Link to="/">Beranda</Link>
            <Link to="/#tentang">Tentang</Link>
            <Link to="/#program">Program</Link>
            <Link to="/register">Daftar Sekarang</Link>
          </nav>
        </header>
      ) : null}

      <main className="page">
        <ScrollToHash />
        <Routes>
          <Route
            path="/"
            element={<HomePage isAdminAuthenticated={Boolean(authState.user)} />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/admin"
            element={
              authState.isLoading ? (
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
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminRoute ? (
        <footer className="site-footer">
          <span>Portal pendaftaran mahasiswa baru Universitas Klabat.</span>
        </footer>
      ) : null}
    </div>
  );
}

export default App;
