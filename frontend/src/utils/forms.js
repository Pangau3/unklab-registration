import {
  MAX_UPLOAD_SIZE_BYTES,
  PROGRAMS,
  REGISTRATION_DOCUMENTS,
} from "../registrationConfig";

export function createEmptyRegisterForm() {
  return {
    name: "",
    email: "",
    phone: "",
    address: "",
    previousSchool: "",
    birthDate: "",
    program: "",
    photo: null,
    ktp: null,
    ijazah: null,
  };
}

export function createEmptyLoginForm() {
  return {
    username: "",
    password: "",
  };
}

export function buildRegisterFormData(form) {
  const formData = new FormData();
  formData.append("name", form.name.trim());
  formData.append("email", form.email.trim());
  formData.append("phone", normalizePhone(form.phone));
  formData.append("address", form.address.trim());
  formData.append("previousSchool", form.previousSchool.trim());
  formData.append("birthDate", form.birthDate);
  formData.append("program", form.program);
  formData.append("photo", form.photo);
  formData.append("ktp", form.ktp);
  formData.append("ijazah", form.ijazah);
  return formData;
}

export function validateRegisterForm(form) {
  const errors = {};

  if (form.name.trim().length < 3) {
    errors.name = "Nama lengkap minimal 3 karakter.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Format email tidak valid.";
  }

  if (!isValidPhone(normalizePhone(form.phone))) {
    errors.phone = "Nomor HP harus berisi 10 sampai 15 digit.";
  }

  if (form.address.trim().length < 10) {
    errors.address = "Alamat minimal 10 karakter.";
  }

  if (form.previousSchool.trim().length < 3) {
    errors.previousSchool = "Asal sekolah minimal 3 karakter.";
  }

  if (!form.birthDate) {
    errors.birthDate = "Tanggal lahir wajib diisi.";
  }

  if (!PROGRAMS.includes(form.program)) {
    errors.program = "Pilih salah satu program studi yang tersedia.";
  }

  for (const field of Object.keys(REGISTRATION_DOCUMENTS)) {
    validateFile(form[field], field, REGISTRATION_DOCUMENTS[field].accept, errors);
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = {};

  if (!form.username.trim()) {
    errors.username = "Username wajib diisi.";
  }

  if (!form.password.trim()) {
    errors.password = "Password wajib diisi.";
  }

  return errors;
}

export function normalizePhone(value) {
  return value.replace(/[()\-\s]/g, "").trim();
}

export function isValidPhone(value) {
  const normalizedValue = value.startsWith("+") ? value.slice(1) : value;
  return /^\d{10,15}$/.test(normalizedValue);
}

export function clearFieldError(name, setFieldErrors) {
  setFieldErrors((currentErrors) => {
    if (!currentErrors[name]) {
      return currentErrors;
    }

    const nextErrors = { ...currentErrors };
    delete nextErrors[name];
    return nextErrors;
  });
}

function validateFile(file, field, allowedExtensions, errors) {
  if (!file) {
    errors[field] = "Dokumen ini wajib diunggah.";
    return;
  }

  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some((extension) =>
    fileName.endsWith(extension)
  );

  if (!hasValidExtension) {
    errors[field] = `Format file tidak sesuai. Gunakan ${allowedExtensions.join(", ")}.`;
    return;
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    errors[field] = "Ukuran file maksimal 5 MB.";
  }
}
