import { useAuth } from '../AuthContext';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-primary to-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">♟️</div>
          <h1 className="text-4xl font-bold text-white mb-2">Chess Routine</h1>
          <p className="text-gray-400">A minimalist study tracker</p>
        </div>

        {/* Card */}
        <div className="bg-primary rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">
            Keep a record of your chess study. Log sessions, track projects, and see where your time actually goes.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <p className="text-sm text-gray-300">Build a habit that sticks</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">📈</span>
              <p className="text-sm text-gray-300">Log study sessions in seconds</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <p className="text-sm text-gray-300">Balance openings, tactics, endgames and more</p>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={login}
            className="w-full bg-accent hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Login with Lichess</span>
            <span>→</span>
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            We use Lichess OAuth for secure authentication
          </p>
        </div>
      </div>
    </div>
  );
}
