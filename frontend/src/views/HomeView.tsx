import MobileLayout from "../components/MobileLayout";

type HomeViewProps = {
  onCreateGroup: () => void;
  onMyGroups: () => void;
  onLogout: () => void;
  toast: string | null;
};

function HomeView({ onCreateGroup, onMyGroups, onLogout, toast }: HomeViewProps) {
  return (
    <MobileLayout
      toast={toast}
      headerRight={
        <>
          <button
            type="button"
            onClick={onCreateGroup}
            className="rounded-lg bg-orange-500 px-2.5 py-1.5 text-[11px] font-semibold text-white"
          >
            + Grupa
          </button>
          <button
            type="button"
            onClick={onMyGroups}
            className="rounded-lg border border-orange-300 bg-orange-50 px-2.5 py-1.5 text-[11px] font-semibold text-orange-700"
          >
            Grupy
          </button>
        </>
      }
    >
      <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Witaj w ParagonSplit</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Twórz grupy wydatków, zapraszaj znajomych po emailu i skanuj paragony z telefonu.
          OCR wyciągnie produkty i ceny, a Ty podzielisz koszty w grupie.
        </p>
      </section>

      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={onCreateGroup}
          className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
        >
          Utwórz nową grupę
        </button>
        <button
          type="button"
          onClick={onMyGroups}
          className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700"
        >
          Moje grupy
        </button>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-auto rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700"
      >
        Wyloguj się
      </button>
    </MobileLayout>
  );
}

export default HomeView;
