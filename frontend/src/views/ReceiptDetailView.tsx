import { useState } from "react";
import MobileLayout from "../components/MobileLayout";
import {
  computePaymentSummary,
  getItemAssignees,
  getReceiptDisplayName,
  getReceiptImageUrl
} from "../services/receiptService";
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
  onAssignItem: (itemId: string, userId: string) => Promise<void>;
};

function ReceiptDetailView({
  receipt,
  loading,
  error,
  onBack,
  onDelete,
  onUpdateTitle,
  onUpdateItem,
  onAddItem,
  onAssignItem
}: ReceiptDetailViewProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
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

  const paymentSummary = receipt ? computePaymentSummary(receipt.items) : [];

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

  const toggleAssignee = async (itemId: string, userId: string) => {
    setSaving(true);
    setActionError("");
    try {
      await onAssignItem(itemId, userId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nie udało się przypisać pozycji.");
    } finally {
      setSaving(false);
    }
  };

  const members = receipt?.group.members ?? [];

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

          {paymentSummary.length > 0 ? (
            <section className="mt-4 rounded-xl border border-orange-200 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-900">Kto ile płaci</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Koszt produktu dzielony równo między przypisane osoby
              </p>
              <ul className="mt-3 space-y-2">
                {paymentSummary.map((entry) => (
                  <li
                    key={entry.userId}
                    className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-zinc-800">{entry.username}</span>
                    <span className="text-sm font-semibold text-orange-700">
                      {entry.amount.toFixed(2)} zł
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <ul className="mt-4 space-y-2">
            {receipt.items.map((item) => {
              const assignees = getItemAssignees(item);

              return (
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
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                          <p className="text-xs text-zinc-500">
                            {item.quantity} × {item.unitPrice} zł
                          </p>
                          {assignees.length > 0 ? (
                            <p className="mt-1 text-xs font-medium text-orange-700">
                              → {assignees.map((a) => a.username).join(", ")}
                              {assignees.length > 1 ? (
                                <span className="font-normal text-zinc-500">
                                  {" "}
                                  (po {(Number(item.totalPrice) / assignees.length).toFixed(2)} zł)
                                </span>
                              ) : null}
                            </p>
                          ) : null}
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
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              setAssigningItemId(assigningItemId === item.id ? null : item.id);
                              setEditingItemId(null);
                              setActionError("");
                            }}
                            className="text-xs font-medium text-zinc-600"
                          >
                            Przypisz
                          </button>
                        </div>
                      </div>
                      {assigningItemId === item.id ? (
                        <div className="mt-3 border-t border-zinc-100 pt-3">
                          <p className="mb-2 text-xs font-medium text-zinc-600">
                            Kliknij, aby dodać lub usunąć osobę
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {members.map((member) => {
                              const isAssigned = assignees.some((a) => a.id === member.user.id);

                              return (
                                <button
                                  key={member.user.id}
                                  type="button"
                                  disabled={saving}
                                  onClick={() => toggleAssignee(item.id, member.user.id)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                                    isAssigned
                                      ? "bg-orange-500 text-white"
                                      : "border border-orange-200 bg-orange-50 text-orange-800"
                                  }`}
                                >
                                  {member.user.username}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
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

          {receipt.rawOcrText ? (
            <details className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-zinc-700 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  Surowy tekst OCR
                  <span className="text-[11px] font-normal text-zinc-500">Rozwiń</span>
                </span>
              </summary>
              <div className="border-t border-zinc-200 px-3 pb-3 pt-2">
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={copyOcrText}
                    className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                  >
                    {copiedOcr ? "Skopiowano" : "Kopiuj"}
                  </button>
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
                  {receipt.rawOcrText}
                </pre>
              </div>
            </details>
          ) : null}

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
