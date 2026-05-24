import { useState, type FormEvent } from "react";

type LoginViewProps = {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  onSwitchToRegister: () => void;
};

function LoginView({ onSubmit, onSwitchToRegister }: LoginViewProps) {
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
    <section className="w-full rounded-3xl border border-orange-200 bg-white p-6 shadow-lg shadow-orange-200/60">
      <h2 className="text-xl font-semibold text-zinc-900">Logowanie</h2>
      <p className="mt-1 text-sm text-zinc-600">Zaloguj się, aby przejść do aplikacji.</p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
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
          required
        />
        <button
          className="w-full rounded-xl bg-orange-500 px-4 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          disabled={loading}
          type="submit"
        >
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <p className="mt-5 text-sm text-zinc-600">
        Nie masz konta?{" "}
        <button
          type="button"
          className="font-medium text-orange-600 underline decoration-orange-300 underline-offset-4 hover:text-orange-700"
          onClick={onSwitchToRegister}
        >
          Przejdź do rejestracji
        </button>
      </p>
    </section>
  );
}

export default LoginView;
