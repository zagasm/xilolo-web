// pages/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { api, authHeaders } from "../../../lib/apiClient";
import {
  clearActiveAuthStorage,
  rememberAccount,
} from "../../../lib/authStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organiser, setOrganiser] = useState(null);
  const [token, setToken] = useState(null);
  const [security, setSecurity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /** persist helpers */
  const persist = (u, t, o) => {
    if (u) localStorage.setItem("userdata", JSON.stringify(u));
    if (o) localStorage.setItem("organiserdata", JSON.stringify(o));
    if (t) localStorage.setItem("token", t);
  };

  useEffect(() => {
    const u = localStorage.getItem("userdata");
    const o = localStorage.getItem("organiserdata");
    const t = localStorage.getItem("token");
    if (u && t) {
      setUser(JSON.parse(u));
      setToken(t);
    }
    if (o) {
      setOrganiser(JSON.parse(o));
    }
    setIsLoading(false);
  }, []);

  /** Login (full replace) */
  const login = ({ user: u, token: t, organiser: o, security: s }) => {
    setUser(u);
    setOrganiser(o ?? u?.organiser ?? u?.organizer ?? null);
    setToken(t);
    setSecurity(s ?? null);
    persist(u, t, o ?? u?.organiser ?? u?.organizer ?? null);
    if (u) rememberAccount(u, t);
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const res = await api.get("/api/v1/profile", authHeaders(token));

      // Adjust this depending on how your backend wraps it
      const payload = res?.data?.data || res?.data || {};
      const freshUser = payload.user || payload;
      const freshOrganiser =
        payload.organiser ||
        payload.organizer ||
        freshUser?.organiser ||
        freshUser?.organizer ||
        null;

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
      setUser(u);
      if (u) localStorage.setItem("userdata", JSON.stringify(u));
      else localStorage.removeItem("userdata");
      if (u) rememberAccount(u, typeof t !== "undefined" ? t : token);
    }
    if (typeof o !== "undefined") {
      setOrganiser(o);
      if (o) localStorage.setItem("organiserdata", JSON.stringify(o));
      else localStorage.removeItem("organiserdata");
    }
    if (typeof s !== "undefined") {
      setSecurity(s);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setOrganiser(null);
    setSecurity(null);
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
