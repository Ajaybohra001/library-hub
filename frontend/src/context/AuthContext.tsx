import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type User = { id: string; email: string; role: "MEMBER" | "STAFF" };
type Auth = {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
};
const AuthContext = createContext<Auth | undefined>(undefined);
function decode(token: string): User {
  const payload = JSON.parse(
    atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
  );
  return { id: payload.sub, email: payload.email, role: payload.role };
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("accessToken");
    try {
      return token ? decode(token) : null;
    } catch {
      return null;
    }
  });
  const value = useMemo(
    () => ({
      user,
      login: (token: string) => {
        localStorage.setItem("accessToken", token);
        setUser(decode(token));
      },
      logout: () => {
        localStorage.removeItem("accessToken");
        setUser(null);
      },
    }),
    [user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
