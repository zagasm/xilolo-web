const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const CDN_STORAGE_BASE_URL = "https://xilolo.b-cdn.net/";
const DEFAULT_STORAGE_BASE_URL = API_BASE_URL
  ? `${String(API_BASE_URL).replace(/\/+$/, "")}/storage/`
  : CDN_STORAGE_BASE_URL;

export function resolveMediaUrl(url, baseUrl = DEFAULT_STORAGE_BASE_URL) {
  if (!url) return "";

  const trimmedUrl = String(url).trim();
  if (!trimmedUrl) return "";

  if (/^(?:https?:)?\/\//i.test(trimmedUrl) || trimmedUrl.startsWith("data:")) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith("/storage/")) {
    if (!API_BASE_URL) return trimmedUrl;
    return `${String(API_BASE_URL).replace(/\/+$/, "")}${trimmedUrl}`;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = trimmedUrl.replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`;
}

export { CDN_STORAGE_BASE_URL, DEFAULT_STORAGE_BASE_URL };
