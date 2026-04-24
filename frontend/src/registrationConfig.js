import registrationConfig from "../../shared/registration-config.json";

export const PROGRAMS = registrationConfig.programs;
export const MAX_UPLOAD_SIZE_BYTES = registrationConfig.maxUploadSizeBytes;
export const STATUS_FILTER_OPTIONS = registrationConfig.statusFilterOptions;
export const REGISTRATION_DOCUMENTS = registrationConfig.documents;

export const DOCUMENT_HINTS = Object.fromEntries(
  Object.entries(REGISTRATION_DOCUMENTS).map(([key, document]) => [key, document.helpText])
);

export const DOCUMENT_ACCEPT = Object.fromEntries(
  Object.entries(REGISTRATION_DOCUMENTS).map(([key, document]) => [
    key,
    document.accept.join(","),
  ])
);
