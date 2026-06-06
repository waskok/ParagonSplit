import { useRef, useState } from "react";
import MobileLayout from "../components/MobileLayout";

type ScanReceiptViewProps = {
  groupName: string;
  onBack: () => void;
  onScan: (file: File, title: string) => Promise<void>;
};

function ScanReceiptView({ groupName, onBack, onScan }: ScanReceiptViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError("Wybierz lub zrób zdjęcie paragonu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onScan(selectedFile, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd skanowania.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout onBack={onBack} title="Skan paragonu">
      <p className="mb-3 text-sm text-zinc-600">
        Grupa: <span className="font-medium text-zinc-900">{groupName}</span>
      </p>

      <label className="text-sm font-medium text-zinc-700">Nazwa paragonu</label>
      <input
        className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-orange-400"
        placeholder="np. Zakupy Biedronka, Obiad w piątek"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="mt-4 rounded-2xl border border-dashed border-orange-300 bg-orange-50/40 p-4 text-center">
        {preview ? (
          <img src={preview} alt="Podgląd paragonu" className="mx-auto max-h-64 rounded-xl object-contain" />
        ) : (
          <p className="text-sm text-zinc-500">Dodaj zdjęcie paragonu z galerii lub aparatu</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="rounded-xl bg-orange-500 px-3 py-3 text-sm font-semibold text-white"
        >
          Zrób zdjęcie
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-orange-300 bg-orange-50 px-3 py-3 text-sm font-semibold text-orange-700"
        >
          Z galerii
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleScan}
        disabled={loading || !selectedFile}
        className="mt-auto rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-zinc-400"
      >
        {loading ? "Skanowanie OCR..." : "Skanuj paragon"}
      </button>
    </MobileLayout>
  );
}

export default ScanReceiptView;
