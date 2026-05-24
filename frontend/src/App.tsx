import { useEffect, useMemo, useState } from "react";
import LoginView from "./views/LoginView";
import RegisterView from "./views/RegisterView";
import { loginRequest, registerRequest } from "./services/authService";
import appLogo from "./assets/ParagonSplit.png";

const TOKEN_KEY = "paragonsplit_token";
type AuthMode = "login" | "register";

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showLoginToast, setShowLoginToast] = useState(false);

  const isLoggedIn = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!showLoginToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowLoginToast(false);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [showLoginToast]);

  const handleRegister = async (payload: { name: string; email: string; password: string }) => {
    await registerRequest(payload);
  };

  const handleLogin = async (payload: { email: string; password: string }) => {
    const response = await loginRequest(payload);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    setShowLoginToast(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAuthMode("login");
    setShowLoginToast(false);
  };

  if (isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col rounded-3xl border border-orange-200 bg-white p-4 shadow-lg shadow-orange-200/60">
          {showLoginToast ? (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Zalogowano pomyślnie
            </div>
          ) : null}

          <header className="mb-6 flex items-start justify-between gap-3">
            <img
              src={appLogo}
              alt="ParagonSplit logo"
              className="h-14 w-14 rounded-2xl border border-orange-200 object-cover shadow-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
              >
                Utwórz grupę
              </button>
              <button
                type="button"
                className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                Moje grupy
              </button>
            </div>
          </header>

          <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
            <h1 className="text-xl font-semibold text-zinc-900">Witaj w ParagonSplit</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              To mobilna aplikacja do dzielenia paragonów i rachunków w grupach. Dodasz wydatki,
              przypiszesz pozycje do osób i sprawdzisz, kto komu ile jest winien.
            </p>
          </section>

          <div className="mt-auto pt-6">
            <button
              type="button"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition hover:bg-zinc-100"
              onClick={handleLogout}
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center py-6">
        <header className="mb-5 px-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">ParagonSplit</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Bezpieczne logowanie i rejestracja do zarządzania wspólnymi wydatkami.
          </p>
        </header>

        <div className="mb-4 grid grid-cols-2 rounded-2xl border border-orange-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              authMode === "login"
                ? "bg-orange-500 text-white"
                : "text-zinc-600 hover:bg-orange-50"
            }`}
            onClick={() => setAuthMode("login")}
          >
            Logowanie
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              authMode === "register"
                ? "bg-orange-500 text-white"
                : "text-zinc-600 hover:bg-orange-50"
            }`}
            onClick={() => setAuthMode("register")}
          >
            Rejestracja
          </button>
        </div>

        {authMode === "login" ? (
          <LoginView onSubmit={handleLogin} onSwitchToRegister={() => setAuthMode("register")} />
        ) : (
          <RegisterView onSubmit={handleRegister} onSwitchToLogin={() => setAuthMode("login")} />
        )}
      </div>
    </main>
  );
}

export default App;
