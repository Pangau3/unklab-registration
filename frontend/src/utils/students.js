export function createSummary() {
  return {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };
}

export function countStudents(students) {
  return students.reduce((summary, student) => {
    summary.total += 1;

    if (student.status === "Pending") {
      summary.pending += 1;
    }
    if (student.status === "Approved") {
      summary.approved += 1;
    }
    if (student.status === "Rejected") {
      summary.rejected += 1;
    }

    return summary;
  }, createSummary());
}

export function isImageDocument(document) {
  return Boolean(document?.contentType?.startsWith("image/"));
}

export function isPDFDocument(document) {
  return document?.contentType === "application/pdf";
}
