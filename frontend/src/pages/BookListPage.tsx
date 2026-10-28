import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getBooks } from "../api/books";
import { apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function BookListPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") ?? "";
  const page = Number(sp.get("page") ?? 1);
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["books", q, page],
    queryFn: () => getBooks({ q, page, limit: 20 }),
  });
  const books = query.data?.items ?? [];
  return (
    <section className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            Explore the collection
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Find your next great read
          </h1>
        </div>
        {user?.role === "STAFF" && (
          <Link
            className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700"
            to="/books/new"
          >
            + Add Book
          </Link>
        )}
      </div>
      <form
        className="flex max-w-2xl gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSp({
            q: (e.currentTarget.elements.namedItem("q") as HTMLInputElement)
              .value,
            page: "1",
          });
        }}
      >
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          name="q"
          defaultValue={q}
          placeholder="Search by title, author, or ISBN"
        />
        <button className="rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700">
          Search
        </button>
      </form>
      {query.isLoading && <p className="text-slate-500">Loading books…</p>}
      {query.isError && (
        <p className="rounded-lg bg-red-50 p-4 text-red-700" role="alert">
          {apiError(query.error)}
        </p>
      )}
      {!query.isLoading && !books.length && (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-md">
          No books found.
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {books.map((b: any) => (
          <Link
            className="group rounded-xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            key={b.id}
            to={`/books/${b.id}`}
          >
            <div className="mb-8 flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-4xl">
              📚
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 group-hover:text-blue-600">
                  {b.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{b.author}</p>
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${b.availableCopies > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {b.availableCopies > 0 ? "Available" : "Unavailable"}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {b.availableCopies} of {b.totalCopies} copies available
            </p>
          </Link>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        <button
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setSp({ q, page: String(page - 1) })}
        >
          Previous
        </button>
        <span className="px-3 py-2 text-sm text-slate-500">Page {page}</span>
        <button
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
          disabled={books.length < 20}
          onClick={() => setSp({ q, page: String(page + 1) })}
        >
          Next
        </button>
      </div>
    </section>
  );
}
