"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  roleName?: string;
  permissions?: string[];
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  workspaceId: string | null;
  workspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, company: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
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
          setWorkspaceId(data.workspace?.id || null);
          setWorkspace(data.workspace || null);
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

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: password || "password123" }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const { data } = await res.json();
      setUser(data.user);
      setWorkspaceId(data.workspace?.id || null);
      setWorkspace(data.workspace || null);
      
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to login: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, company: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const { data } = await res.json();
      setUser(data.user);
      setWorkspaceId(data.workspace?.id || null);
      setWorkspace(data.workspace || null);
      
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to register: " + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWorkspaceId(null);
    setWorkspace(null);
    router.push("/login");
  };

  const hasPermission = (permission: string) => {
    // Admin override for legacy users
    if (user?.role === "admin" && !user?.roleId) return true;
    return user?.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, workspaceId, workspace, isLoading, login, register, logout, hasPermission }}>
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
