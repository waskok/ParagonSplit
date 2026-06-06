import { useState, type FormEvent } from "react";
import MobileLayout from "../components/MobileLayout";

type CreateGroupViewProps = {
  onBack: () => void;
  onSubmit: (name: string) => Promise<void>;
};

function CreateGroupView({ onBack, onSubmit }: CreateGroupViewProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć grupy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout onBack={onBack} title="Nowa grupa">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <label className="text-sm font-medium text-zinc-700">Nazwa grupy</label>
        <input
          className="mt-2 rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-orange-400"
          placeholder="np. Mieszkanie, Wyjazd 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-auto rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:bg-orange-300"
        >
          {loading ? "Tworzenie..." : "Utwórz grupę"}
        </button>
      </form>
    </MobileLayout>
  );
}

export default CreateGroupView;
