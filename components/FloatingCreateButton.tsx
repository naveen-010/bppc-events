'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus } from 'lucide-react';

export default function FloatingCreateButton() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!mounted || !user) return null;

  return (
    <Link
      href="/events/create"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-medium"
    >
      <Plus className="w-5 h-5" />
      <span className="hidden sm:inline">Create Event</span>
    </Link>
  );
}
