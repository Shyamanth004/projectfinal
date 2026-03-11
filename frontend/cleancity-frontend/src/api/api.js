const BASE_URL = "http://127.0.0.1:3000";

export async function apiRequest(endpoint, method = "GET", body = null, headers = {}) {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  return response.json();
}
