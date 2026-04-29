import { useAuth } from '../AuthContext';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-primary to-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">♟️</div>
          <h1 className="text-4xl font-bold text-white mb-2">Chess Study Tracker</h1>
          <p className="text-gray-400">Track your chess improvement with ease</p>
        </div>

        {/* Card */}
        <div className="bg-primary rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">
            Sign in with your Lichess account to start tracking your chess study sessions and progress.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <p className="text-sm text-gray-300">Track study time and puzzles solved</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">📈</span>
              <p className="text-sm text-gray-300">Visualize your progress with charts</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <p className="text-sm text-gray-300">Focus on different study areas</p>
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
