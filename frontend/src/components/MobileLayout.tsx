import type { ReactNode } from "react";
import appLogo from "../assets/ParagonSplit.png";

type MobileLayoutProps = {
  children: ReactNode;
  onBack?: () => void;
  title?: string;
  headerRight?: ReactNode;
  toast?: string | null;
};

function MobileLayout({ children, onBack, title, headerRight, toast }: MobileLayoutProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col rounded-3xl border border-orange-200 bg-white p-4 shadow-lg shadow-orange-200/60">
        {toast ? (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {toast}
          </div>
        ) : null}

        <header className="mb-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg border border-orange-200 px-2 py-1 text-xs font-medium text-orange-700"
              >
                ←
              </button>
            ) : (
              <img
                src={appLogo}
                alt="ParagonSplit"
                className="h-12 w-12 shrink-0 rounded-2xl border border-orange-200 object-cover shadow-sm"
              />
            )}
            {title ? (
              <h1 className="truncate text-base font-semibold text-zinc-900">{title}</h1>
            ) : null}
          </div>
          {headerRight ? <div className="flex shrink-0 gap-2">{headerRight}</div> : null}
        </header>

        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </main>
  );
}

export default MobileLayout;
