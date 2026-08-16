export const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export function decodeTokenPayload(token) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(json);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

export function getStoredUserRole() {
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  if (storedUser?.role) {
    return String(storedUser.role).toLowerCase();
  }

  const token = localStorage.getItem('access_token');
  const claims = decodeTokenPayload(token);
  if (!claims) return null;

  const rawRole = claims.role ?? claims.user_role ?? claims.userRole ?? claims.role_name ?? claims.roles ?? claims.authorities ?? claims.is_admin;

  const normalizeRole = (value) => {
    if (value == null) return null;
    if (typeof value === 'boolean') return value ? 'admin' : 'job_seeker';
    if (Array.isArray(value)) {
      const lowered = value.map((item) => String(item).toLowerCase());
      if (lowered.some((item) => item === 'admin' || item.includes('admin'))) return 'admin';
      if (lowered.some((item) => item === 'job_seeker' || item.includes('job_seeker'))) return 'job_seeker';
      return 'job_seeker';
    }
    const normalized = String(value).toLowerCase();
    if (normalized === 'admin' || normalized.includes('admin')) return 'admin';
    if (normalized === 'job_seeker' || normalized.includes('job_seeker')) return 'job_seeker';
    if (normalized === 'candidate') return 'job_seeker';
    return normalized;
  };

  return normalizeRole(rawRole);
}

export function logLoggedInUser(label = 'Logged in user') {
  const token = localStorage.getItem('access_token');
  const claims = decodeTokenPayload(token);
  const role = getStoredUserRole();

  console.log(label, {
    hasToken: Boolean(token),
    tokenPreview: token ? `${token.slice(0, 20)}...` : null,
    claims,
    role,
    user: {
      id: claims?.id ?? claims?.user_id ?? claims?.sub ?? null,
      email: claims?.email ?? claims?.user_email ?? null,
      full_name: claims?.full_name ?? claims?.name ?? claims?.username ?? null,
      role: claims?.role ?? claims?.user_role ?? claims?.userRole ?? null,
      rawClaims: claims
    }
  });

  return { token, claims, role };
}

export function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
