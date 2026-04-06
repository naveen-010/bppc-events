'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { Menu, X, Plus, LayoutDashboard, LogOut, User, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-[var(--card)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">BP</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-lg">BPPC Events</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-[var(--accent)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-[var(--muted-foreground)]" />
                ) : (
                  <Moon className="w-5 h-5 text-[var(--muted-foreground)]" />
                )}
              </button>
            )}

            {loading ? (
              <div className="w-9 h-9 rounded-xl bg-[var(--muted)] animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/events/create"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Link>

                <div className="hidden md:flex items-center gap-1">
                  <Link
                    href="/dashboard"
                    className="p-2.5 rounded-xl hover:bg-[var(--accent)] transition-colors"
                    aria-label="Dashboard"
                  >
                    <LayoutDashboard className="w-5 h-5 text-[var(--muted-foreground)]" />
                  </Link>
                </div>

                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--accent)] transition-colors">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        className="w-8 h-8 rounded-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-56 py-2 bg-[var(--card)] rounded-xl border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-sm text-[var(--muted-foreground)] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--accent)] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--accent)] transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2.5 rounded-xl hover:bg-[var(--accent)] transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:opacity-90 transition-opacity font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {mobileMenuOpen && user && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              <Link
                href="/events/create"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Event</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--accent)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--accent)] transition-colors text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
