const apiCall = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem("token");

  const response = await fetch("/api/${endpoint}", {
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
