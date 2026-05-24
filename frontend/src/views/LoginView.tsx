import { useState, type FormEvent } from "react";

type LoginViewProps = {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
};

function LoginView({ onSubmit }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit({ email, password });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Wystąpił nieznany błąd.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Logowanie</h2>
      <p className="mt-1 text-sm text-slate-500">Zaloguj się, aby przejść do aplikacji.</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={loading}
          type="submit"
        >
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

export default LoginView;
