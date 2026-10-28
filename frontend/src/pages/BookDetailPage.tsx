import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getBook } from "../api/books";
import { createLoan } from "../api/loans";
import { createReservation } from "../api/reservations";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
export function BookDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const book = useQuery({ queryKey: ["book", id], queryFn: () => getBook(id) });
  const action = useMutation({
    mutationFn: (reserve: boolean) =>
      reserve ? createReservation({ bookId: id }) : createLoan({ bookId: id }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["book", id] });
      void qc.invalidateQueries({ queryKey: ["books"] });
    },
  });
  if (book.isLoading)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-slate-500">Loading…</p>
    );
  if (book.isError)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-red-700" role="alert">
        {apiError(book.error)}
      </p>
    );
  const b = book.data;
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Link className="text-sm font-semibold text-blue-600" to="/books">
        ← Back to books
      </Link>
      <div className="mt-8 grid gap-10 rounded-2xl bg-white p-8 shadow-md md:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-6 flex h-48 max-w-sm items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-7xl">
            📖
          </div>
          <h1 className="text-4xl font-bold text-slate-900">{b.title}</h1>
          <p className="mt-2 text-lg text-slate-500">by {b.author}</p>
          <p className="mt-6 leading-7 text-slate-600">
            {b.description || "No description available."}
          </p>
          <p className="mt-6 text-sm text-slate-500">ISBN: {b.isbn}</p>
        </div>
        <div className="flex min-w-56 flex-col items-start gap-5 md:items-end">
          <span
            className={`rounded-full px-4 py-2 text-sm font-bold ${b.availableCopies > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {b.availableCopies > 0
              ? `${b.availableCopies} copies available`
              : "Currently unavailable"}
          </span>
          {user && b.availableCopies > 0 && (
            <button
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={action.isPending}
              onClick={() => action.mutate(false)}
            >
              Borrow book
            </button>
          )}
          {user && b.availableCopies === 0 && (
            <button
              className="w-full rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
              disabled={action.isPending}
              onClick={() => action.mutate(true)}
            >
              Reserve book
            </button>
          )}
          {!user && (
            <p className="text-sm text-slate-500">
              Log in to borrow or reserve.
            </p>
          )}
          {action.isError && (
            <p className="text-sm text-red-600" role="alert">
              {apiError(action.error)}
            </p>
          )}
          {action.isSuccess && (
            <p className="text-sm font-medium text-green-600">
              Action completed successfully.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
