export function isRequired(value) {
  return value !== undefined && value !== null && value !== "";
}

export function isValidPhone(phone) {
  return /^09\d{9}$/.test(phone || "");
}
