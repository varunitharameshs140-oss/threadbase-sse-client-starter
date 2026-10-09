
import { createContext, useContext, useState } from "react";
import apiClient from "../services/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("accessToken") || null
  );

  // Restore Authorization header after browser reload
  if (token) {
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${token}`;
  }

  async function login(email, password) {
    const { data } = await apiClient.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${data.accessToken}`;

    setToken(data.accessToken);
    setUser(data.user);

    return data;
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    delete apiClient.defaults.headers.common["Authorization"];

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
