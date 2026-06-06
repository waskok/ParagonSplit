import { useState, type FormEvent } from "react";
import MobileLayout from "../components/MobileLayout";
import { getReceiptDisplayName } from "../services/receiptService";
import type { GroupDetail, ReceiptSummary } from "../types";

type GroupDetailViewProps = {
  group: GroupDetail | null;
  loading: boolean;
  error: string;
  onBack: () => void;
  onScanReceipt: () => void;
  onSelectReceipt: (receiptId: string) => void;
  onInvite: (email: string) => Promise<string>;
  onDeleteReceipt: (receiptId: string) => Promise<void>;
  onUpdateReceiptTitle: (receiptId: string, title: string) => Promise<void>;
};

function GroupDetailView({
  group,
  loading,
  error,
  onBack,
  onScanReceipt,
  onSelectReceipt,
  onInvite,
  onDeleteReceipt,
  onUpdateReceiptTitle
}: GroupDetailViewProps) {
  const [email, setEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [receiptActionError, setReceiptActionError] = useState("");
  const [savingReceiptId, setSavingReceiptId] = useState<string | null>(null);

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    setInviteError("");
    setInviteMsg("");
    setInviting(true);
    try {
      const msg = await onInvite(email.trim());
      setInviteMsg(msg);
      setEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Błąd zaproszenia.");
    } finally {
      setInviting(false);
    }
  };

  const startEditTitle = (receipt: ReceiptSummary) => {
    setEditingReceiptId(receipt.id);
    setEditTitle(receipt.title ?? getReceiptDisplayName(receipt));
    setReceiptActionError("");
  };

  const saveTitle = async (receiptId: string) => {
    setSavingReceiptId(receiptId);
    setReceiptActionError("");
    try {
      await onUpdateReceiptTitle(receiptId, editTitle.trim());
      setEditingReceiptId(null);
    } catch (err) {
      setReceiptActionError(err instanceof Error ? err.message : "Nie udało się zapisać nazwy.");
    } finally {
      setSavingReceiptId(null);
    }
  };

  const handleDelete = async (receiptId: string) => {
    if (!window.confirm("Usunąć ten paragon z listy?")) return;
    setSavingReceiptId(receiptId);
    setReceiptActionError("");
    try {
      await onDeleteReceipt(receiptId);
      if (editingReceiptId === receiptId) setEditingReceiptId(null);
    } catch (err) {
      setReceiptActionError(err instanceof Error ? err.message : "Nie udało się usunąć paragonu.");
    } finally {
      setSavingReceiptId(null);
    }
  };

  return (
    <MobileLayout
      onBack={onBack}
      title={group?.name ?? "Grupa"}
      headerRight={
        <button
          type="button"
          onClick={onScanReceipt}
          className="rounded-lg bg-orange-500 px-2.5 py-1.5 text-[11px] font-semibold text-white"
        >
          Skanuj
        </button>
      }
    >
      {loading ? <p className="text-sm text-zinc-500">Ładowanie...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {receiptActionError ? <p className="text-sm text-red-600">{receiptActionError}</p> : null}

      {group ? (
        <>
          <section className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
            <p className="text-xs text-zinc-500">Właściciel</p>
            <p className="font-medium text-zinc-900">{group.owner.name}</p>
            <p className="mt-3 text-xs text-zinc-500">Członkowie</p>
            <ul className="mt-1 space-y-1">
              {group.members.map((m) => (
                <li key={m.id} className="text-sm text-zinc-700">
                  {m.user.name} ({m.user.email})
                </li>
              ))}
            </ul>
          </section>

          {group.myRole === "OWNER" ? (
            <form onSubmit={handleInvite} className="mt-4">
              <label className="text-sm font-medium text-zinc-700">Zaproś po emailu</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:bg-orange-300"
                >
                  Dodaj
                </button>
              </div>
              {inviteMsg ? <p className="mt-2 text-xs text-emerald-600">{inviteMsg}</p> : null}
              {inviteError ? <p className="mt-2 text-xs text-red-600">{inviteError}</p> : null}
            </form>
          ) : null}

          <section className="mt-4">
            <h3 className="text-sm font-semibold text-zinc-800">Paragony</h3>
            {group.receipts.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Brak paragonów w tej grupie.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {group.receipts.map((r) => (
                  <li key={r.id} className="rounded-xl border border-zinc-200 p-3">
                    {editingReceiptId === r.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Nazwa paragonu"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={savingReceiptId === r.id}
                            onClick={() => saveTitle(r.id)}
                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-orange-300"
                          >
                            Zapisz
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingReceiptId(null)}
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectReceipt(r.id)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-zinc-900">
                            {getReceiptDisplayName(r)}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {r._count?.items ?? 0} pozycji · {r.total ? `${r.total} zł` : "—"}
                          </p>
                        </button>
                        <div className="mt-2 flex gap-3 border-t border-zinc-100 pt-2">
                          <button
                            type="button"
                            disabled={savingReceiptId === r.id}
                            onClick={() => startEditTitle(r)}
                            className="text-xs font-medium text-orange-600 disabled:text-orange-300"
                          >
                            Zmień nazwę
                          </button>
                          <button
                            type="button"
                            disabled={savingReceiptId === r.id}
                            onClick={() => handleDelete(r.id)}
                            className="text-xs font-medium text-red-600 disabled:text-red-300"
                          >
                            Usuń
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            type="button"
            onClick={onScanReceipt}
            className="mt-auto rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Zrób zdjęcie paragonu
          </button>
        </>
      ) : null}
    </MobileLayout>
  );
}

export default GroupDetailView;
