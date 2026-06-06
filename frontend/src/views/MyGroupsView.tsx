import MobileLayout from "../components/MobileLayout";
import type { GroupSummary, PendingInvitation } from "../types";

type MyGroupsViewProps = {
  groups: GroupSummary[];
  invitations: PendingInvitation[];
  loading: boolean;
  error: string;
  actionError: string;
  actingOnInvitationId: string | null;
  deletingGroupId: string | null;
  onBack: () => void;
  onCreateGroup: () => void;
  onSelectGroup: (groupId: string) => void;
  onRefresh: () => void;
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
  onDeleteGroup: (groupId: string, groupName: string) => Promise<void>;
};

function MyGroupsView({
  groups,
  invitations,
  loading,
  error,
  actionError,
  actingOnInvitationId,
  deletingGroupId,
  onBack,
  onCreateGroup,
  onSelectGroup,
  onRefresh,
  onAcceptInvitation,
  onDeclineInvitation,
  onDeleteGroup
}: MyGroupsViewProps) {
  return (
    <MobileLayout
      onBack={onBack}
      title="Moje grupy"
      headerRight={
        <button
          type="button"
          onClick={onCreateGroup}
          className="rounded-lg bg-orange-500 px-2.5 py-1.5 text-[11px] font-semibold text-white"
        >
          + Grupa
        </button>
      }
    >
      {loading ? <p className="text-sm text-zinc-500">Ładowanie...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

      {invitations.length > 0 ? (
        <section className="mb-5">
          <h3 className="text-sm font-semibold text-zinc-800">Zaproszenia</h3>
          <ul className="mt-2 space-y-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="rounded-xl border border-amber-200 bg-amber-50/80 p-4"
              >
                <p className="font-semibold text-zinc-900">{invitation.group.name}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Od: {invitation.invitedBy.username} · {invitation.group._count?.members ?? 0}{" "}
                  członków
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={actingOnInvitationId === invitation.id}
                    onClick={() => onAcceptInvitation(invitation.id)}
                    className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:bg-orange-300"
                  >
                    Dołącz
                  </button>
                  <button
                    type="button"
                    disabled={actingOnInvitationId === invitation.id}
                    onClick={() => onDeclineInvitation(invitation.id)}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-50"
                  >
                    Odrzuć
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h3 className="text-sm font-semibold text-zinc-800">Twoje grupy</h3>

      {!loading && groups.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">Nie masz jeszcze żadnych grup.</p>
      ) : null}

      <ul className="mt-2 space-y-3">
        {groups.map((group) => (
          <li key={group.id}>
            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <button
                type="button"
                onClick={() => onSelectGroup(group.id)}
                className="w-full text-left"
              >
                <p className="font-semibold text-zinc-900">{group.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {group._count?.members ?? group.members.length} członków ·{" "}
                  {group._count?.receipts ?? 0} paragonów
                  {group.myRole === "OWNER" ? (
                    <span className="ml-1 text-orange-600">· właściciel</span>
                  ) : null}
                </p>
              </button>
              {group.myRole === "OWNER" ? (
                <button
                  type="button"
                  disabled={deletingGroupId === group.id}
                  onClick={() => onDeleteGroup(group.id, group.name)}
                  className="mt-3 w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                >
                  {deletingGroupId === group.id ? "Usuwanie..." : "Usuń grupę"}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onRefresh}
        className="mt-auto rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-700"
      >
        Odśwież listę
      </button>
    </MobileLayout>
  );
}

export default MyGroupsView;
