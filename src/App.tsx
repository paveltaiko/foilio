import { useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AuthGuard } from './components/auth/AuthGuard';
import { HomePage } from './pages/HomePage';
import { SharedCollectionPage } from './pages/SharedCollectionPage';
import { CollectionsV2LabPage } from './pages/lab/CollectionsV2LabPage';
import { CollectionsSettingsPage } from './pages/lab/CollectionsSettingsPage';
import { CollectionsSettingsProvider } from './pages/lab/CollectionsSettingsContext';

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading, error, login, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchClick = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <CollectionsSettingsProvider userId={user?.uid ?? null}>
      <div className="min-h-svh bg-surface-secondary flex flex-col overflow-x-hidden">
        <Header
          userName={user?.displayName}
          userPhoto={user?.photoURL}
          onLogin={login}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          isLoggedIn={!!user}
          onSearchClick={pathname === '/settings' ? undefined : handleSearchClick}
        />
        <main className="flex-1 overflow-y-auto pt-3 pb-8" style={{ scrollbarGutter: 'stable' }}>
          <Routes>
            <Route
              path="/"
              element={
                <AuthGuard user={user} loading={loading} onLogin={login}>
                  {user && <HomePage user={user} isSearchOpen={isSearchOpen} onSearchClose={handleSearchClose} />}
                </AuthGuard>
              }
            />
            <Route
              path="/share/:token"
              element={<SharedCollectionPage currentUserId={user?.uid ?? null} isSearchOpen={isSearchOpen} onSearchClose={handleSearchClose} />}
            />
            <Route
              path="/lab/collections-v2"
              element={<CollectionsV2LabPage />}
            />
            <Route
              path="/settings"
              element={<CollectionsSettingsPage />}
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
    </CollectionsSettingsProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
