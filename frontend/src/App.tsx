import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { AddBookPage } from "./pages/AddBookPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { BookListPage } from "./pages/BookListPage";
import { FinesPage } from "./pages/FinesPage";
import { LoginPage } from "./pages/LoginPage";
import { LoansPage } from "./pages/LoansPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReservationsPage } from "./pages/ReservationsPage";

function StaffRoute() {
  const { user } = useAuth();
  return user?.role === "STAFF" ? (
    <AddBookPage />
  ) : (
    <p role="alert">You are not authorized to access this page.</p>
  );
}
export function App() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/books" replace />} />
          <Route path="/books" element={<BookListPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/fines" element={<FinesPage />} />
          </Route>
          <Route path="/books/new" element={<StaffRoute />} />
          <Route
            path="*"
            element={
              <p>
                Page not found. <a href="/books">Browse books</a>
              </p>
            }
          />
        </Routes>
      </main>
    </>
  );
}
