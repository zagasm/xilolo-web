// src/analytics.js
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = "G-QCPBRK3240";

export const initGA = () => {
  ReactGA.initialize(GA_MEASUREMENT_ID);
};

export const trackPageView = (path, title) => {
  ReactGA.send({
    hitType: "pageview",
    page: path,
    title,
  });
};

export const trackEvent = ({ category, action, label, value }) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};