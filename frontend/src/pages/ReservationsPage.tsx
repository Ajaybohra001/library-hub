import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiError } from "../api/client";
import { cancelReservation, getReservations } from "../api/reservations";
export function ReservationsPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["reservations"],
    queryFn: () => getReservations(),
  });
  const mutation = useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reservations"] });
      void qc.invalidateQueries({ queryKey: ["books"] });
    },
  });
  if (query.isLoading)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-slate-500">
        Loading reservations…
      </p>
    );
  if (query.isError)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-red-700" role="alert">
        {apiError(query.error)}
      </p>
    );
  const reservations = query.data?.items ?? query.data ?? [];
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Keep your place in line
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My Reservations
        </h1>
      </div>
      {!reservations.length ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <p className="text-slate-500">No reservations.</p>
          <Link
            className="mt-3 inline-block font-semibold text-blue-600"
            to="/books"
          >
            Browse books →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r: any) => (
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-md"
              key={r.id}
            >
              <div>
                <h2 className="font-bold text-slate-800">
                  {r.book?.title ?? r.bookId}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Reserved{" "}
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${r.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : r.status === "HOLD" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
                >
                  {r.status}
                </span>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(r.id)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {mutation.isError && (
        <p className="text-red-600" role="alert">
          {apiError(mutation.error)}
        </p>
      )}
    </section>
  );
}
