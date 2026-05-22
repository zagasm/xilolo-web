// src/GoogleAnalyticsTracker.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "./analytics";

export default function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path, document.title);
  }, [location]);

  return null;
}