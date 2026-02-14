import { useState } from 'react';
import { Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AuthGuard } from './components/auth/AuthGuard';
import { HomePage } from './pages/HomePage';
import { SharedCollectionPage } from './pages/SharedCollectionPage';

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading, error, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-svh bg-surface-secondary flex flex-col overflow-x-hidden">
      <Header
        userName={user?.displayName}
        userPhoto={user?.photoURL}
        onLogin={login}
        onLogout={logout}
        isLoggedIn={!!user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route
            path="/"
            element={
              <AuthGuard user={user} loading={loading} onLogin={login}>
                {user && <HomePage user={user} searchQuery={searchQuery} />}
              </AuthGuard>
            }
          />
          <Route
            path="/user/:userId"
            element={<SharedCollectionPage currentUserId={user?.uid ?? null} searchQuery={searchQuery} />}
          />
        </Routes>
        {error && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-primary-50 border border-primary-200 text-primary-700 text-sm rounded-lg px-4 py-3 animate-fade-in z-50">
            {error}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
