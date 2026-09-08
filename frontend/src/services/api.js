const API_BASE = '/api';

/**
 * Multi-Tab Isolated Storage Engine
 * Uses sessionStorage as the primary per-tab authority to completely prevent cross-tab session clobbering.
 * Also synchronizes with role-namespaced localStorage keys (medikiosk_token_patient, medikiosk_token_doctor)
 * so that tabs can operate concurrently as Patient and Doctor without role collisions or 403 errors.
 */

export const getToken = () => {
  try {
    const sessionToken = sessionStorage.getItem('medikiosk_token');
    if (sessionToken) return sessionToken;
    const localToken = localStorage.getItem('medikiosk_token');
    if (localToken) {
      sessionStorage.setItem('medikiosk_token', localToken);
      return localToken;
    }
  } catch (e) {}
  return null;
};

export const setToken = (token, role) => {
  try {
    if (token) {
      sessionStorage.setItem('medikiosk_token', token);
      localStorage.setItem('medikiosk_token', token);
      if (role) {
        sessionStorage.setItem('medikiosk_role', role);
        localStorage.setItem(`medikiosk_token_${role}`, token);
      }
    }
  } catch (e) {}
};

export const removeToken = () => {
  try {
    const currentRole = sessionStorage.getItem('medikiosk_role');
    sessionStorage.removeItem('medikiosk_token');
    sessionStorage.removeItem('medikiosk_role');
    localStorage.removeItem('medikiosk_token');
    if (currentRole) {
      localStorage.removeItem(`medikiosk_token_${currentRole}`);
    }
  } catch (e) {}
};

export const getUser = () => {
  try {
    const s = sessionStorage.getItem('medikiosk_user');
    if (s) return JSON.parse(s);
    const l = localStorage.getItem('medikiosk_user');
    if (l) {
      sessionStorage.setItem('medikiosk_user', l);
      return JSON.parse(l);
    }
  } catch (e) {}
  return null;
};

export const setUser = (user) => {
  try {
    if (user) {
      const val = JSON.stringify(user);
      sessionStorage.setItem('medikiosk_user', val);
      localStorage.setItem('medikiosk_user', val);
      if (user.role) {
        sessionStorage.setItem('medikiosk_role', user.role);
        localStorage.setItem(`medikiosk_user_${user.role}`, val);
      }
    }
  } catch (e) {}
};

export const removeUser = () => {
  try {
    const currentRole = sessionStorage.getItem('medikiosk_role');
    sessionStorage.removeItem('medikiosk_user');
    localStorage.removeItem('medikiosk_user');
    if (currentRole) {
      localStorage.removeItem(`medikiosk_user_${currentRole}`);
    }
  } catch (e) {}
};

export const getStoredProfile = () => {
  try {
    const s = sessionStorage.getItem('medikiosk_profile');
    if (s) return JSON.parse(s);
    const l = localStorage.getItem('medikiosk_profile');
    if (l) {
      sessionStorage.setItem('medikiosk_profile', l);
      return JSON.parse(l);
    }
  } catch (e) {}
  return null;
};

export const setStoredProfile = (profile) => {
  try {
    if (profile) {
      const val = JSON.stringify(profile);
      sessionStorage.setItem('medikiosk_profile', val);
      localStorage.setItem('medikiosk_profile', val);
      const currentRole = sessionStorage.getItem('medikiosk_role');
      if (currentRole) {
        localStorage.setItem(`medikiosk_profile_${currentRole}`, val);
      }
    }
  } catch (e) {}
};

export const removeStoredProfile = () => {
  try {
    const currentRole = sessionStorage.getItem('medikiosk_role');
    sessionStorage.removeItem('medikiosk_profile');
    localStorage.removeItem('medikiosk_profile');
    if (currentRole) {
      localStorage.removeItem(`medikiosk_profile_${currentRole}`);
    }
  } catch (e) {}
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle json body vs FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) => request(url, { method: 'POST', body }),
  put: (url, body) => request(url, { method: 'PUT', body }),
  delete: (url) => request(url, { method: 'DELETE' }),

  uploadFile: (url, formData) => {
    const token = getToken();
    return fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.message || 'File upload failed');
        err.rejected = data.rejected;
        err.details = data.details;
        err.status = res.status;
        throw err;
      }
      return data;
    });
  },
};
