export const getToken = async () => {
    const response = await fetch("/api/openapi/token");
    const data = await response.json();
    return data.client_secret.value;
  };