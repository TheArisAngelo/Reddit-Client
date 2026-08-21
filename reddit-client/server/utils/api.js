const API_BASE = process.env.REACT_APP_API_URL || "";

const apiCall = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API_BASE}/api/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    sessionStorage.clear();
    window.location.href = "/login";
  }

  return response.json();
};

export default apiCall;
