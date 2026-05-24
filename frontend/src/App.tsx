import { useMemo, useState } from "react";
import LoginView from "./views/LoginView";
import RegisterView from "./views/RegisterView";
import { loginRequest, registerRequest } from "./services/authService";

const TOKEN_KEY = "paragonsplit_token";

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const isLoggedIn = useMemo(() => Boolean(token), [token]);

  const handleRegister = async (payload: { name: string; email: string; password: string }) => {
    await registerRequest(payload);
  };

  const handleLogin = async (payload: { email: string; password: string }) => {
    const response = await loginRequest(payload);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
  };

  if (isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <section className="w-full max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-semibold text-slate-900">Zalogowano! Witaj w ParagonSplit</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">ParagonSplit</h1>
          <p className="mt-2 text-slate-600">
            Rejestracja i logowanie - etap 1 fundamentu aplikacji.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <RegisterView onSubmit={handleRegister} />
          <LoginView onSubmit={handleLogin} />
        </div>
      </div>
    </main>
  );
}

export default App;
