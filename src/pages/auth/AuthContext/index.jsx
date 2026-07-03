// pages/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { api, authHeaders } from "../../../lib/apiClient";
import {
  clearActiveAuthStorage,
  rememberAccount,
} from "../../../lib/authStorage";
import { clearWalletFlowStorage } from "../../../features/wallet/walletFlowStorage";
import { queryClient } from "../../../lib/queryClient";

const AuthContext = createContext();
const LOCAL_API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

function normalizeStoredMediaUrl(value) {
  if (!value || typeof value !== "string" || !LOCAL_API_BASE) return value;

  const apiBase = LOCAL_API_BASE.replace(/\/+$/, "");
  const trimmed = value.trim();

  if (trimmed.startsWith("/storage/")) {
    return `${apiBase}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);

    if (import.meta.env.DEV && parsed.pathname.startsWith("/storage/") && parsed.origin !== apiBase) {
      return `${apiBase}${parsed.pathname}`;
    }
  } catch {
    return value;
  }

  return value;
}

function normalizeOrganiserPayload(organiser) {
  if (!organiser || typeof organiser !== "object") return organiser;

  return {
    ...organiser,
    profileImage: normalizeStoredMediaUrl(organiser.profileImage),
    profileUrl: normalizeStoredMediaUrl(organiser.profileUrl),
  };
}

function normalizeUserPayload(user) {
  if (!user || typeof user !== "object") return user;

  return {
    ...user,
    profileUrl: normalizeStoredMediaUrl(
      user.profileUrl ||
      user.profile_url ||
      user.avatar_url ||
      user.avatar ||
      user.profile_image
    ),
    organiser: normalizeOrganiserPayload(user.organiser),
    organizer: normalizeOrganiserPayload(user.organizer),
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organiser, setOrganiser] = useState(null);
  const [token, setToken] = useState(null);
  const [security, setSecurity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /** persist helpers */
  const persist = (u, t, o) => {
    const normalizedUser = normalizeUserPayload(u);
    const normalizedOrganiser = normalizeOrganiserPayload(o);

    if (normalizedUser) localStorage.setItem("userdata", JSON.stringify(normalizedUser));
    if (normalizedOrganiser) localStorage.setItem("organiserdata", JSON.stringify(normalizedOrganiser));
    if (t) localStorage.setItem("token", t);
  };

  useEffect(() => {
    const u = localStorage.getItem("userdata");
    const o = localStorage.getItem("organiserdata");
    const t = localStorage.getItem("token");
    if (u && t) {
      setUser(normalizeUserPayload(JSON.parse(u)));
      setToken(t);
    }
    if (o) {
      setOrganiser(normalizeOrganiserPayload(JSON.parse(o)));
    }
    setIsLoading(false);
  }, []);

  /** Login (full replace) */
  const login = ({ user: u, token: t, organiser: o, security: s }) => {
    const normalizedUser = normalizeUserPayload(u);
    const normalizedOrganiser =
      normalizeOrganiserPayload(o ?? normalizedUser?.organiser ?? normalizedUser?.organizer ?? null);

    queryClient.clear();
    clearWalletFlowStorage();
    setUser(normalizedUser);
    setOrganiser(normalizedOrganiser);
    setToken(t);
    setSecurity(s ?? null);
    persist(normalizedUser, t, normalizedOrganiser);
    if (normalizedUser) rememberAccount(normalizedUser, t);
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const res = await api.get("/api/v1/profile", authHeaders(token));

      // Adjust this depending on how your backend wraps it
      const payload = res?.data?.data || res?.data || {};
      const freshUser = normalizeUserPayload(payload.user || payload);
      const freshOrganiser =
        normalizeOrganiserPayload(
          payload.organiser ||
          payload.organizer ||
          freshUser?.organiser ||
          freshUser?.organizer ||
          null
        );

      setUser(freshUser);
      setOrganiser(freshOrganiser);
      localStorage.setItem("userdata", JSON.stringify(freshUser));
      if (freshOrganiser) {
        localStorage.setItem("organiserdata", JSON.stringify(freshOrganiser));
      } else {
        localStorage.removeItem("organiserdata");
      }
      rememberAccount(freshUser, token);
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  /** Update only token and/or user (used after password change, profile edits, etc.) */
  const setAuth = ({ user: u, token: t, organiser: o, security: s }) => {
    if (typeof t !== "undefined") {
      setToken(t);
      if (t) localStorage.setItem("token", t);
      else localStorage.removeItem("token");
    }
    if (typeof u !== "undefined") {
      const normalizedUser = normalizeUserPayload(u);
      setUser(normalizedUser);
      if (normalizedUser) localStorage.setItem("userdata", JSON.stringify(normalizedUser));
      else localStorage.removeItem("userdata");
      if (normalizedUser) rememberAccount(normalizedUser, typeof t !== "undefined" ? t : token);
    }
    if (typeof o !== "undefined") {
      const normalizedOrganiser = normalizeOrganiserPayload(o);
      setOrganiser(normalizedOrganiser);
      if (normalizedOrganiser) localStorage.setItem("organiserdata", JSON.stringify(normalizedOrganiser));
      else localStorage.removeItem("organiserdata");
    }
    if (typeof s !== "undefined") {
      setSecurity(s);
    }
  };

  const logout = () => {
    queryClient.clear();
    setUser(null);
    setToken(null);
    setOrganiser(null);
    setSecurity(null);
    clearWalletFlowStorage();
    clearActiveAuthStorage();
  };

  /** BUGFIX: this should be true when we HAVE a token/user */
  const isAuthenticated = !!token; // or !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        organiser,
        token,
        security,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setAuth,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
