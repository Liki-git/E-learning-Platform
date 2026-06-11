const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
};

export const DEFAULT_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

export const courseImageUrl = (image) => resolveMediaUrl(image) || DEFAULT_COURSE_IMAGE;
