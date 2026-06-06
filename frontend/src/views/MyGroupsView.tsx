import MobileLayout from "../components/MobileLayout";
import type { GroupSummary } from "../types";

type MyGroupsViewProps = {
  groups: GroupSummary[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onSelectGroup: (groupId: string) => void;
  onRefresh: () => void;
};

function MyGroupsView({
  groups,
  loading,
  error,
  onBack,
  onSelectGroup,
  onRefresh
}: MyGroupsViewProps) {
  return (
    <MobileLayout onBack={onBack} title="Moje grupy">
      {loading ? <p className="text-sm text-zinc-500">Ładowanie...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && groups.length === 0 ? (
        <p className="text-sm text-zinc-500">Nie masz jeszcze żadnych grup.</p>
      ) : null}

      <ul className="space-y-3">
        {groups.map((group) => (
          <li key={group.id}>
            <button
              type="button"
              onClick={() => onSelectGroup(group.id)}
              className="w-full rounded-xl border border-orange-100 bg-orange-50/50 p-4 text-left"
            >
              <p className="font-semibold text-zinc-900">{group.name}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {group._count?.members ?? group.members.length} członków ·{" "}
                {group._count?.receipts ?? 0} paragonów
              </p>
            </button>
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
