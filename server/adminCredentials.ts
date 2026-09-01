const ADMIN_EMAIL = "tadi@gmail.com";
const ADMIN_PASSWORD = "12345678";

export function isValidAdminCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export function getHardcodedAdminEmail() {
  return ADMIN_EMAIL;
}
