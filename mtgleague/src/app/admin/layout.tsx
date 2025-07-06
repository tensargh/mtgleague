"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [, setUserRole] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Theme management
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    // Check authentication and role
    const checkAuthAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }

      setUserEmail(session.user.email ?? null);

      // Get user role from our users table
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        setUserRole(userData.role);
        console.log('Admin layout user role:', userData.role);
        // Check if user has admin role
        if (userData.role !== 'admin') {
          // Redirect based on role
          if (userData.role === 'tournament_organiser') {
            router.replace('/to');
          } else {
            router.replace('/login');
          }
          return;
        }
      } else {
        // User not found in our users table
        router.replace('/login');
        return;
      }

      setLoading(false);
    };

    checkAuthAndRole();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUserEmail(session.user.email ?? null);
        
        // Re-check role on auth change
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData && userData.role !== 'admin') {
          console.log('Admin layout user role (auth change):', userData.role);
          if (userData.role === 'tournament_organiser') {
            router.replace('/to');
          } else {
            router.replace('/login');
          }
        }
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  // Show loading while checking auth/role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Left menu */}
      <aside className="w-56 bg-white dark:bg-gray-800 border-r flex flex-col py-6 px-4 shadow-sm justify-between">
        <div>
          <h2 className="text-lg font-bold mb-8 tracking-wide text-gray-900 dark:text-gray-100">Admin Panel</h2>
          <nav className="flex flex-col gap-2">
            <Link href="/admin/stores" className="py-2 px-3 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-medium text-gray-800 dark:text-gray-100">Stores</Link>
            <Link href="/admin/users" className="py-2 px-3 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-medium text-gray-800 dark:text-gray-100">Users</Link>
            {/* Add more links here as features grow */}
          </nav>
        </div>
        {/* Theme picker at the bottom */}
        <div className="mt-8 flex flex-col items-center">
          <label htmlFor="theme-select" className="text-xs text-gray-600 dark:text-gray-300 mb-1">Theme</label>
          <select
            id="theme-select"
            className="border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none"
            value={theme}
            onChange={e => setTheme(e.target.value as 'light' | 'dark')}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b flex items-center justify-between px-8 shadow-sm">
          {/* Store picker (placeholder) */}
          <div>
            <select className="border rounded px-3 py-1 bg-gray-50 dark:bg-gray-700 dark:text-gray-100">
              <option>Store Picker</option>
              {/* Populate with store options */}
            </select>
          </div>
          {/* User info with dropdown */}
          <div className="relative flex items-center gap-2" ref={dropdownRef}>
            <span className="font-medium text-gray-700 dark:text-gray-100 hidden md:block">{userEmail ? `Logged in as: ${userEmail}` : '...'}</span>
            <button
              className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-100 font-bold focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-label="User menu"
              type="button"
            >
              {userEmail ? userEmail[0].toUpperCase() : '?'}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
} 