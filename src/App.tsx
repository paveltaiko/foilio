import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { AuthGuard } from './components/auth/AuthGuard';
import { CollectionPage } from './pages/CollectionPage';
import { SharedCollectionPage } from './pages/SharedCollectionPage';
import { CollectionsSettingsProvider } from './providers/CollectionsSettingsContext';
import { SecretLairDropSettingsProvider } from './providers/SecretLairDropSettingsContext';
import { DashboardPage } from './pages/DashboardPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { CollectionsSettingsPage } from './pages/settings/CollectionsSettingsPage';
import { SettingsSupportPage } from './pages/settings/SettingsSupportPage';
import { SettingsAboutPage } from './pages/settings/SettingsAboutPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieBanner } from './components/ui/CookieBanner';
import { SearchInput } from './components/filters/SearchInput';
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient();
const isStandalone = window.matchMedia('(display-mode: standalone)').matches

function AppContent() {
  const { user, loading, error, login, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    document.body.scrollTo({ top: 0 });
    document.documentElement.scrollTo({ top: 0 });
  }, [pathname]);

  const handleSearchClick = useCallback(() => {
    if (pathname !== '/collection') navigate('/collection');
    setIsSearchOpen(true);
  }, [pathname, navigate]);

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/collection');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/dashboard');
  }, [logout, navigate]);

  return (
    <SecretLairDropSettingsProvider userId={user?.uid ?? null}>
    <CollectionsSettingsProvider userId={user?.uid ?? null}>
      <div className="min-h-svh bg-surface-secondary flex flex-col overflow-x-hidden">
        <Header
          userName={user?.displayName}
          userPhoto={user?.photoURL}
          onLogin={login}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          isLoggedIn={!!user}
          onSearchClick={isStandalone ? undefined : handleSearchClick}
          onMobileBack={pathname.startsWith('/settings') && pathname !== '/settings' ? handleBack : undefined}
        />
        <main ref={mainRef} className={`flex-1 overflow-y-auto pt-3 sm:pb-8 ${user ? 'pb-nav' : 'pb-8'}`} style={{ scrollbarGutter: 'stable' }}>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/collection"
              element={
                <AuthGuard user={user} loading={loading} onLogin={login}>
                  {user && <CollectionPage user={user} isSearchOpen={isSearchOpen} searchQuery={searchQuery} />}
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AuthGuard user={user} loading={loading} onLogin={login}>
                  {user && <DashboardPage />}
                </AuthGuard>
              }
            />
            <Route
              path="/share/:token"
              element={<SharedCollectionPage currentUserId={user?.uid ?? null} isSearchOpen={isSearchOpen} searchQuery={searchQuery} />}
            />
            <Route
              path="/settings"
              element={<SettingsPage />}
            />
            <Route
              path="/settings/collections"
              element={<CollectionsSettingsPage />}
            />
            <Route
              path="/settings/secret-lair"
              element={<CollectionsSettingsPage />}
            />
            <Route
              path="/settings/support"
              element={<SettingsSupportPage />}
            />
            <Route
              path="/settings/about"
              element={<SettingsAboutPage />}
            />
            <Route
              path="/privacy"
              element={<PrivacyPolicyPage />}
            />
            <Route
              path="/terms"
              element={<TermsOfServicePage />}
            />
            <Route
              path="/support"
              element={<Navigate to="/settings/support" replace />}
            />
          </Routes>
          </ErrorBoundary>
          {error && (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-primary-50 border border-primary-200 text-primary-700 text-sm rounded-lg px-4 py-3 animate-fade-in z-50">
              {error}
            </div>
          )}
        </main>
        <SearchInput
          inputRef={searchInputRef}
          value={searchQuery}
          onChange={setSearchQuery}
          isOpen={isSearchOpen}
          onClose={handleSearchClose}
        />
        <BottomNav
          isLoggedIn={!!user}
          onSearchClick={handleSearchClick}
        />
        {!isStandalone && <Footer />}
        <CookieBanner />
        <Analytics />
      </div>
    </CollectionsSettingsProvider>
    </SecretLairDropSettingsProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
