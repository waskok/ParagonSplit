import { useState, type FormEvent } from "react";

type RegisterViewProps = {
  onSubmit: (payload: { name: string; email: string; password: string }) => Promise<void>;
};

function RegisterView({ onSubmit }: RegisterViewProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await onSubmit({ name, email, password });
      setSuccess("Konto zostało utworzone. Możesz się zalogować.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Wystąpił nieznany błąd.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">Rejestracja</h2>
      <p className="mt-1 text-sm text-slate-500">Utwórz konto, aby korzystać z ParagonSplit.</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
          type="text"
          placeholder="Imię"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
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
          minLength={6}
          required
        />
        <button
          className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={loading}
          type="submit"
        >
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}
    </section>
  );
}

export default RegisterView;
