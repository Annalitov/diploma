export const getAuthToken = () => {
  const token = localStorage.getItem("access_token");
  const expiresAt = localStorage.getItem("expires_at");

  if (!token || Date.now() > Number(expiresAt)) {
    return null;
  }

  return token;
};
