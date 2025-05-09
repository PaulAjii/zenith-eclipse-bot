export const getToken = async (): Promise<string> => {
    const response = await fetch("/api/openapi/token");
    const data = await response.json();
    return data.client_secret.value;
  };