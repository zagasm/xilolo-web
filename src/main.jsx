import React from "react";
import { App } from "./app.jsx";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/vendor/icons/feather.css";
import "./assets/css/style.css";
import "./style.css";
import "./styles/tailwind.css";

import { AuthProvider, useAuth } from "./pages/auth/AuthContext/index.jsx";
import { HelmetProvider } from "react-helmet-async";
import { ModalProvider } from "./component/assets/ModalContext/index.jsx";
import { store } from "./store";

import { initGA } from "./analytics";
import GoogleAnalyticsTracker from "./GoogleAnalyticsTracker.jsx";

initGA();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const RootWrapper = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <GoogleAnalyticsTracker />
      <App />
    </BrowserRouter>
  );
};

const GoogleProviderBoundary = ({ children }) => {
  if (!GOOGLE_CLIENT_ID) {
    return children;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

createRoot(document.getElementById("root")).render(
  <ReduxProvider store={store}>
    <GoogleProviderBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <ModalProvider>
              <RootWrapper />
            </ModalProvider>
          </HelmetProvider>
        </QueryClientProvider>
      </AuthProvider>
    </GoogleProviderBoundary>
  </ReduxProvider>
);
