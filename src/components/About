interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="min-h-screen bg-secondary text-white">
      <header className="border-b border-gray-800 bg-primary">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <h1 className="text-xl font-bold">Chess Routine</h1>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg bg-primary p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-3">About This App</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Chess Routine is a clean, distraction-free dashboard built to help you track your daily study habits, manage tactical training, and monitor your long-term progress like a fitness tracker.
          </p>
          <p className="text-gray-400 text-xs">
            Built with React, Tailwind CSS, and Supabase.
          </p>
        </div>
      </main>
    </div>
  );
}
