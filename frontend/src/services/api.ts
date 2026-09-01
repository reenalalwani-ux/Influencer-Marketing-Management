const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getHeaders = () => ({
  'Content-Type': 'application/json'
  // No Authorization header needed — HttpOnly cookie is sent automatically by the browser
});

/**
 * Dispatches a global 'session:expired' event so App.tsx can redirect to the
 * login page when any API call returns 401 (token expired after 24 h, or the
 * token was replaced because another user logged in on the same account).
 */
const dispatchSessionExpired = () => {
  window.dispatchEvent(new CustomEvent('session:expired'));
};

const parseJsonResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      // 401 → session expired or invalidated by a new login on another device
      if (res.status === 401) {
        dispatchSessionExpired();
      }
      // Attach status field so catch blocks can inspect it (e.g. 'Pending Approval')
      const err: any = new Error(data.message || 'API request failed');
      err.status = data.status;
      err.httpStatus = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }
  const text = await res.text();
  throw new Error(`Server returned status ${res.status}: ${res.statusText || 'Non-JSON response: ' + text.slice(0, 100)}`);
};

const executeFetch = async (fetchCall: () => Promise<Response>) => {
  try {
    const res = await fetchCall();
    return await parseJsonResponse(res);
  } catch (err: any) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Server connection issue. The backend server may be restarting — please try again in a moment.');
    }
    throw err;
  }
};

export const api = {
  async get(endpoint: string) {
    return executeFetch(() => fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders(),
      credentials: 'include'
    }));
  },

  async post(endpoint: string, body: any) {
    return executeFetch(() => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body)
    }));
  },

  async put(endpoint: string, body: any) {
    return executeFetch(() => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body)
    }));
  },

  async patch(endpoint: string, body?: any) {
    return executeFetch(() => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    }));
  },

  async delete(endpoint: string) {
    return executeFetch(() => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    }));
  }
};
