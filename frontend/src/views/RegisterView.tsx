import { useState, type FormEvent } from "react";

type RegisterViewProps = {
  onSubmit: (payload: { name: string; email: string; password: string }) => Promise<void>;
  onSwitchToLogin: () => void;
};

function RegisterView({ onSubmit, onSwitchToLogin }: RegisterViewProps) {
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
    <section className="w-full rounded-3xl border border-orange-200 bg-white p-6 shadow-lg shadow-orange-200/60">
      <h2 className="text-xl font-semibold text-zinc-900">Rejestracja</h2>
      <p className="mt-1 text-sm text-zinc-600">Utwórz konto, aby korzystać z ParagonSplit.</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-orange-400"
          type="text"
          placeholder="Imię"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-orange-400"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-orange-400"
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
        <button
          className="w-full rounded-xl bg-orange-500 px-4 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          disabled={loading}
          type="submit"
        >
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

      <p className="mt-5 text-sm text-zinc-600">
        Masz już konto?{" "}
        <button
          type="button"
          className="font-medium text-orange-600 underline decoration-orange-300 underline-offset-4 hover:text-orange-700"
          onClick={onSwitchToLogin}
        >
          Przejdź do logowania
        </button>
      </p>
    </section>
  );
}

export default RegisterView;
