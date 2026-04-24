import { formatFileSize } from "../utils/formatters";

function FileMeta({ file }) {
  if (!file) {
    return null;
  }

  return (
    <span className="file-meta">
      {file.name} | {formatFileSize(file.size)}
    </span>
  );
}

export default FileMeta;
