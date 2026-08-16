export const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
