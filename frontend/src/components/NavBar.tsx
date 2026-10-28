import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition hover:text-blue-400 ${isActive ? "text-white underline underline-offset-8" : "text-slate-300"}`;
  return (
    <nav className="bg-slate-900 px-6 py-4 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
        <Link to="/books" className="text-xl font-bold tracking-tight">
          Library<span className="text-blue-400">Hub</span>
        </Link>
        <NavLink to="/books" className={link}>
          Books
        </NavLink>
        {user ? (
          <>
            <NavLink to="/loans" className={link}>
              My Loans
            </NavLink>
            <NavLink to="/reservations" className={link}>
              Reservations
            </NavLink>
            <NavLink to="/fines" className={link}>
              Fines
            </NavLink>
            {user.role === "STAFF" && (
              <NavLink to="/books/new" className={link}>
                Add Book
              </NavLink>
            )}
            <button
              className="rounded-lg border border-slate-500 px-3 py-1.5 text-sm hover:bg-slate-700"
              onClick={() => {
                logout();
                navigate("/books");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={link}>
              Login
            </NavLink>
            <NavLink
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
            >
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
