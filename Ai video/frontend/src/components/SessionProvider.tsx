"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface Session {
  email: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  session: Session | null;
  setSession: (session: Session | null, token?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  useEffect(() => {
    const email = localStorage.getItem("vidforge_email");
    const isAdmin = localStorage.getItem("vidforge_admin") === "true";
    if (email && localStorage.getItem("vidforge_token")) {
      setSessionState({ email, isAdmin });
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    setSession(nextSession, token) {
      if (nextSession && token) {
        localStorage.setItem("vidforge_token", token);
        localStorage.setItem("vidforge_email", nextSession.email);
        localStorage.setItem("vidforge_admin", String(nextSession.isAdmin));
      } else {
        localStorage.removeItem("vidforge_token");
        localStorage.removeItem("vidforge_email");
        localStorage.removeItem("vidforge_admin");
      }
      setSessionState(nextSession);
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider.");
  return value;
}
