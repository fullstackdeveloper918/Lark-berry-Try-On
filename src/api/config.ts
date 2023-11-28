export const callApi = (
  endpoint: string = "",
  options?: {
    method: "GET" | "POST" | "DELTE" | "PUT" | "PATCH";
    body?: FormData;
  }
) => {
  const baseUrl = "https://test.cybersify.tech/lark-berry/public/api/";
  const headers = {
    method: "GET",
    ...options,
  };
  return fetch(`${baseUrl}${endpoint}`, headers);
};
