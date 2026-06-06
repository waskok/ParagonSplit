import { useState } from "react";
import MobileLayout from "../components/MobileLayout";
import { getReceiptDisplayName, getReceiptImageUrl } from "../services/receiptService";
import type { ReceiptDetail, ReceiptItem } from "../types";

type ReceiptDetailViewProps = {
  receipt: ReceiptDetail | null;
  loading: boolean;
  error: string;
  onBack: () => void;
  onDelete: () => Promise<void>;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateItem: (itemId: string, payload: { name: string; totalPrice: number }) => Promise<void>;
  onAddItem: (payload: { name: string; totalPrice: number }) => Promise<void>;
};

function ReceiptDetailView({
  receipt,
  loading,
  error,
  onBack,
  onDelete,
  onUpdateTitle,
  onUpdateItem,
  onAddItem
}: ReceiptDetailViewProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedOcr, setCopiedOcr] = useState(false);

  const copyOcrText = async () => {
    if (!receipt?.rawOcrText) return;
    try {
      await navigator.clipboard.writeText(receipt.rawOcrText);
      setCopiedOcr(true);
      window.setTimeout(() => setCopiedOcr(false), 2000);
    } catch {
      setActionError("Nie udało się skopiować tekstu OCR.");
    }
  };

  const startEditItem = (item: ReceiptItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.totalPrice));
    setAddingItem(false);
    setActionError("");
  };

  const saveItem = async (itemId: string) => {
    setSaving(true);
    setActionError("");
    try {
      await onUpdateItem(itemId, {
        name: editName.trim(),
        totalPrice: Number(editPrice.replace(",", "."))
      });
      setEditingItemId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nie udało się zapisać pozycji.");
    } finally {
      setSaving(false);
    }
  };

  const saveNewItem = async () => {
    const name = newItemName.trim();
    const totalPrice = Number(newItemPrice.replace(",", "."));

    if (!name) {
      setActionError("Podaj nazwę produktu.");
      return;
    }
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      setActionError("Podaj prawidłową cenę.");
      return;
    }

    setSaving(true);
    setActionError("");
    try {
      await onAddItem({ name, totalPrice });
      setAddingItem(false);
      setNewItemName("");
      setNewItemPrice("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nie udało się dodać pozycji.");
    } finally {
      setSaving(false);
    }
  };

  const saveTitle = async () => {
    setSaving(true);
    setActionError("");
    try {
      await onUpdateTitle(titleValue.trim());
      setEditTitle(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nie udało się zapisać nazwy.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Usunąć ten paragon z listy?")) return;
    setSaving(true);
    setActionError("");
    try {
      await onDelete();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nie udało się usunąć paragonu.");
      setSaving(false);
    }
  };

  return (
    <MobileLayout onBack={onBack} title="Szczegóły paragonu">
      {loading ? <p className="text-sm text-zinc-500">Ładowanie...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

      {receipt ? (
        <>
          <section className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
            {editTitle ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveTitle}
                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Zapisz
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTitle(false)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-zinc-900">
                    {getReceiptDisplayName(receipt)}
                  </p>
                  {receipt.storeName && receipt.title ? (
                    <p className="text-xs text-zinc-500">{receipt.storeName}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTitleValue(receipt.title ?? getReceiptDisplayName(receipt));
                    setEditTitle(true);
                  }}
                  className="shrink-0 text-xs font-medium text-orange-600"
                >
                  Edytuj
                </button>
              </div>
            )}
            <p className="mt-2 text-sm text-zinc-600">
              Suma: {receipt.total ? `${receipt.total} zł` : "—"} · {receipt.items.length} pozycji
            </p>
            <img
              src={getReceiptImageUrl(receipt.imagePath)}
              alt="Zeskanowany paragon"
              className="mt-3 max-h-40 w-full rounded-lg object-contain"
            />
          </section>

          <ul className="mt-4 space-y-2">
            {receipt.items.map((item) => (
              <li key={item.id} className="rounded-xl border border-zinc-200 p-3">
                {editingItemId === item.id ? (
                  <div className="space-y-2">
                    <input
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nazwa produktu"
                    />
                    <input
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Cena (zł)"
                      inputMode="decimal"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => saveItem(item.id)}
                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Zapisz
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {item.quantity} × {item.unitPrice} zł
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-orange-700">{item.totalPrice} zł</p>
                      <button
                        type="button"
                        onClick={() => startEditItem(item)}
                        className="text-xs font-medium text-orange-600"
                      >
                        Edytuj
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {addingItem ? (
            <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-700">Nowa pozycja</p>
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Nazwa produktu"
              />
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="Cena (zł)"
                inputMode="decimal"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveNewItem}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-orange-300"
                >
                  Dodaj
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingItem(false);
                    setNewItemName("");
                    setNewItemPrice("");
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setAddingItem(true);
                setEditingItemId(null);
                setActionError("");
              }}
              className="mt-3 w-full rounded-xl border border-dashed border-orange-300 bg-orange-50/40 px-4 py-3 text-sm font-semibold text-orange-700"
            >
              + Dodaj brakującą pozycję
            </button>
          )}

          {receipt.items.length === 0 && !addingItem ? (
            <p className="mt-4 text-sm text-zinc-500">
              OCR nie wykryło pozycji. Możesz je edytować ręcznie lub zeskanować ponownie.
            </p>
          ) : null}

          <section className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-700">Surowy tekst OCR</p>
              {receipt.rawOcrText ? (
                <button
                  type="button"
                  onClick={copyOcrText}
                  className="shrink-0 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                >
                  {copiedOcr ? "Skopiowano" : "Kopiuj"}
                </button>
              ) : null}
            </div>
            {receipt.rawOcrText ? (
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
                {receipt.rawOcrText}
              </pre>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">Brak zapisanego tekstu OCR.</p>
            )}
          </section>

          <button
            type="button"
            disabled={saving}
            onClick={handleDelete}
            className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            Usuń paragon
          </button>
        </>
      ) : null}
    </MobileLayout>
  );
}

export default ReceiptDetailView;
