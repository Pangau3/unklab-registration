import { Link, useLocation, useNavigate } from "react-router-dom";

function TransitionLink({ children, onClick, to, ...props }) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleClick(event) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      props.target === "_blank" ||
      typeof to !== "string"
    ) {
      return;
    }

    const [rawPathname, ...hashParts] = to.split("#");
    const pathname = rawPathname || location.pathname;
    const hash = hashParts.length > 0 ? `#${hashParts.join("#")}` : "";
    const isSamePath = pathname === location.pathname;

    if (hash && isSamePath && location.hash === hash) {
      event.preventDefault();

      const target = document.querySelector(hash);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (hash && isSamePath) {
      return;
    }

    event.preventDefault();

    const commitNavigation = () => navigate(to);
    const startViewTransition = document.startViewTransition?.bind(document);

    if (startViewTransition) {
      startViewTransition(() => {
        commitNavigation();
      });
      return;
    }

    commitNavigation();
  }

  return (
    <Link {...props} onClick={handleClick} to={to}>
      {children}
    </Link>
  );
}

export default TransitionLink;
