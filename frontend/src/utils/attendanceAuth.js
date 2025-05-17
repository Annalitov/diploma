
export function getDeaneryToken() {
  const token = localStorage.getItem("attendance_token");
  const exp   = localStorage.getItem("attendance_expires");
  if (!token || Date.now() > exp) return null;
  return token;
}
