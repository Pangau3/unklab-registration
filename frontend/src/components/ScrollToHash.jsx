import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const scrollToTarget = () => {
      const target = document.querySelector(location.hash);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToTarget);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.hash, location.pathname]);

  return null;
}

export default ScrollToHash;
