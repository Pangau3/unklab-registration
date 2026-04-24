import { buildDocumentUrl } from "../api";

function DocumentLink({ document, label }) {
  if (!document?.url) {
    return null;
  }

  return (
    <a href={buildDocumentUrl(document.url)} rel="noreferrer" target="_blank">
      {label}
    </a>
  );
}

export default DocumentLink;
