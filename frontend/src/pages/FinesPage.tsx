import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiError } from "../api/client";
import { getFines, payFine } from "../api/fines";
export function FinesPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["fines"], queryFn: () => getFines() });
  const mutation = useMutation({
    mutationFn: payFine,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["fines"] });
      void qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });
  if (query.isLoading)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-slate-500">
        Loading fines…
      </p>
    );
  if (query.isError)
    return (
      <p className="mx-auto max-w-6xl px-6 py-10 text-red-700" role="alert">
        {apiError(query.error)}
      </p>
    );
  const fines = query.data?.items ?? query.data ?? [];
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Account overview
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">My Fines</h1>
        <p className="mt-2 text-slate-500">
          Unpaid fines may prevent borrowing.
        </p>
      </div>
      {!fines.length ? (
        <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-md">
          No fines — you’re all clear!
        </div>
      ) : (
        <div className="space-y-3">
          {fines.map((fine: any) => (
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-md"
              key={fine.id ?? fine.loanId}
            >
              <div>
                <h2 className="font-bold text-slate-800">
                  {fine.reason ?? "Overdue loan"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Amount: ₹
                  {((fine.amountPaise ?? fine.amount ?? 0) / 100).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${(fine.status ?? "UNPAID") === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {fine.status ?? "UNPAID"}
                </span>
                {fine.status !== "PAID" && (
                  <button
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(fine.loanId)}
                  >
                    Pay now
                  </button>
                )}
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
