const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getHeaders = () => ({
  'Content-Type': 'application/json'
  // No Authorization header needed — HttpOnly cookie is sent automatically by the browser
});

const parseJsonResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed');
    return data;
  }
  const text = await res.text();
  throw new Error(`Server returned status ${res.status}: ${res.statusText || 'Non-JSON response'}`);
};

export const api = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders(),
      credentials: 'include'  // Send HttpOnly cookie automatically
    });
    return parseJsonResponse(res);
  },

  async post(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',  // Send HttpOnly cookie automatically
      body: JSON.stringify(body)
    });
    return parseJsonResponse(res);
  },

  async put(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',  // Send HttpOnly cookie automatically
      body: JSON.stringify(body)
    });
    return parseJsonResponse(res);
  },

  async patch(endpoint: string, body?: any) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',  // Send HttpOnly cookie automatically
      body: body ? JSON.stringify(body) : undefined
    });
    return parseJsonResponse(res);
  },

  async delete(endpoint: string) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'  // Send HttpOnly cookie automatically
    });
    return parseJsonResponse(res);
  }
};
