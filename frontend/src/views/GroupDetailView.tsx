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
  onRemoveMember: (userId: string) => Promise<void>;
  onDeleteGroup: () => Promise<void>;
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
  onUpdateReceiptTitle,
  onRemoveMember,
  onDeleteGroup
}: GroupDetailViewProps) {
  const [email, setEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [memberActionError, setMemberActionError] = useState("");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
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

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!window.confirm(`Usunąć ${username} z grupy?`)) return;
    setRemovingUserId(userId);
    setMemberActionError("");
    try {
      await onRemoveMember(userId);
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "Nie udało się usunąć członka.");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Usunąć całą grupę wraz z paragonami? Tej operacji nie można cofnąć.")) {
      return;
    }
    setDeletingGroup(true);
    setMemberActionError("");
    try {
      await onDeleteGroup();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "Nie udało się usunąć grupy.");
      setDeletingGroup(false);
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
      {memberActionError ? <p className="text-sm text-red-600">{memberActionError}</p> : null}

      {group ? (
        <>
          <section className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
            <p className="text-xs text-zinc-500">Właściciel</p>
            <p className="font-medium text-zinc-900">{group.owner.username}</p>
            <p className="mt-3 text-xs text-zinc-500">Członkowie</p>
            <ul className="mt-1 space-y-2">
              {group.members.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-2 text-sm text-zinc-700">
                  <span>
                    {m.user.username} ({m.user.email})
                    {m.role === "OWNER" ? (
                      <span className="ml-1 text-xs text-orange-600">· właściciel</span>
                    ) : null}
                  </span>
                  {group.myRole === "OWNER" && m.role !== "OWNER" ? (
                    <button
                      type="button"
                      disabled={removingUserId === m.user.id}
                      onClick={() => handleRemoveMember(m.user.id, m.user.username)}
                      className="shrink-0 text-xs font-medium text-red-600 disabled:text-red-300"
                    >
                      Usuń
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {group.myRole === "OWNER" && group.invitations.length > 0 ? (
            <section className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-xs font-medium text-zinc-600">Oczekujące zaproszenia</p>
              <ul className="mt-2 space-y-1">
                {group.invitations.map((inv) => (
                  <li key={inv.id} className="text-sm text-zinc-700">
                    {inv.email}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

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
                  Wyślij
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
            className="mt-4 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Zrób zdjęcie paragonu
          </button>

          {group.myRole === "OWNER" ? (
            <button
              type="button"
              disabled={deletingGroup}
              onClick={handleDeleteGroup}
              className="mt-3 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              {deletingGroup ? "Usuwanie..." : "Usuń grupę"}
            </button>
          ) : null}
        </>
      ) : null}
    </MobileLayout>
  );
}

export default GroupDetailView;
