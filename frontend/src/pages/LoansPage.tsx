import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiError } from "../api/client";
import { getLoans, renewLoan, returnLoan } from "../api/loans";
export function LoansPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["loans"], queryFn: () => getLoans() });
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "return" | "renew" }) =>
      action === "return" ? returnLoan(id) : renewLoan(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["loans"] });
      void qc.invalidateQueries({ queryKey: ["books"] });
    },
  });
  if (query.isLoading)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-slate-500">
        Loading loans…
      </p>
    );
  if (query.isError)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-red-700" role="alert">
        {apiError(query.error)}
      </p>
    );
  const loans = query.data?.items ?? query.data ?? [];
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Your reading activity
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">My Loans</h1>
      </div>
      {!loans.length ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <p className="text-slate-500">No loans yet.</p>
          <Link
            className="mt-3 inline-block font-semibold text-blue-600"
            to="/books"
          >
            Browse books →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Book</th>
                <th className="px-6 py-4">Due date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((loan: any) => (
                <tr key={loan.id}>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {loan.book?.title ?? "Unknown book"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {loan.dueAt
                      ? new Date(loan.dueAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${loan.returnedAt ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}
                    >
                      {loan.returnedAt ? "RETURNED" : "ACTIVE"}
                    </span>
                  </td>
                  <td className="space-x-2 px-6 py-4">
                    {!loan.returnedAt && (
                      <>
                        <button
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          disabled={mutation.isPending}
                          onClick={() =>
                            mutation.mutate({ id: loan.id, action: "return" })
                          }
                        >
                          Return
                        </button>
                        {loan.renewalCount < 1 && (
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            disabled={mutation.isPending}
                            onClick={() =>
                              mutation.mutate({ id: loan.id, action: "renew" })
                            }
                          >
                            Renew
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
