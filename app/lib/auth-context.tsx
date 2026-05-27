"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  workspaceId: string | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Removed localStorage mock

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for existing session via API
    const checkSession = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const { data } = await res.json();
          setUser(data.user);
          setWorkspaceId(data.workspace.id);
        }
      } catch (err) {
        console.error("Failed to fetch session", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Redirect unauthenticated users from protected routes
    if (!isLoading && !user && pathname?.startsWith("/dashboard")) {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const { data } = await res.json();
      setUser(data.user);
      setWorkspaceId(data.workspace.id);
      
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWorkspaceId(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, workspaceId, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
