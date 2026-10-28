import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { apiError } from "../api/client";
export function RegisterPage() {
  const [error, setError] = useState("");
  const nav = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await register({
        name: String(f.get("name")),
        email: String(f.get("email")),
        password: String(f.get("password")),
      });
      nav("/login");
    } catch (e) {
      setError(apiError(e));
    }
  }
  return (
    <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
            ✨
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Create your account
          </h1>
          <p className="mt-2 text-slate-500">Join your neighborhood library</p>
        </div>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              name="name"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              name="email"
              type="email"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              name="password"
              type="password"
              required
            />
          </label>
          <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
            Create account
          </button>
        </form>
        {error && (
          <p
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link
            className="font-semibold text-blue-600 hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
