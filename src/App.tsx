import { useState } from 'react';
import { useAuth } from './AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { About } from './components/About';
import { Loader } from './components/Loader';

function App() {
  const { user, loading, error } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'about'>('dashboard');

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center text-red-400">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (currentView === 'about') {
    return <About onBack={() => setCurrentView('dashboard')} />;
  }

  return <Dashboard onOpenAbout={() => setCurrentView('about')} />;
}

export default App;
