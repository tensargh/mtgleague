"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trophy, LogOut, Store } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function TOLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [store, setStore] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and user role
    const checkAuth = async () => {
      console.log('TO Layout: Checking authentication...')
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('TO Layout: No auth user, redirecting to login')
        router.replace('/login');
        return;
      }

      console.log('TO Layout: Auth user found:', authUser.email)
      setUserEmail(authUser.email ?? null);

      // Get user role from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (userError || !userData) {
        console.log('TO Layout: User not found in users table:', userError)
        router.replace('/login');
        return;
      }

      console.log('TO Layout: User role:', userData.role)
      setUserRole(userData.role);

      // Check if user is a TO or admin
      if (userData.role !== 'tournament_organiser' && userData.role !== 'admin') {
        console.log('TO Layout: User is not TO or admin, redirecting to login')
        router.replace('/login');
        return;
      }

      // If admin, redirect to admin panel
      if (userData.role === 'admin') {
        console.log('TO Layout: User is admin, redirecting to admin')
        router.replace('/admin');
        return;
      }

      console.log('TO Layout: User is TO, loading store info')
      // Get store information for TO
      const { data: storeData, error: storeError } = await supabase
        .from('store_tos')
        .select('store_id')
        .eq('user_id', authUser.id)
        .single();

      if (!storeError && storeData?.store_id) {
        // Get the actual store information
        const { data: storeInfo, error: storeInfoError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeData.store_id)
          .single();

        if (!storeInfoError && storeInfo) {
          console.log('TO Layout: Store info loaded:', storeInfo)
          setStore(storeInfo);
        } else {
          console.log('TO Layout: Store info error:', storeInfoError)
        }
      } else {
        console.log('TO Layout: Store assignment error:', storeError)
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUserEmail(session.user.email ?? null);
        await checkAuth();
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
    router.replace('/');
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Left menu */}
      <aside className="w-56 bg-white dark:bg-gray-800 border-r flex flex-col py-6 px-4 shadow-sm justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-8">
            <Trophy className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-bold tracking-wide text-gray-900 dark:text-gray-100">TO Panel</h2>
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/to" className="py-2 px-3 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-medium text-gray-800 dark:text-gray-100">
              Dashboard
            </Link>
            <Link href="/to/seasons" className="py-2 px-3 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-medium text-gray-800 dark:text-gray-100">
              Seasons
            </Link>
            <Link href="/to/players" className="py-2 px-3 rounded hover:bg-blue-100 dark:hover:bg-blue-900 font-medium text-gray-800 dark:text-gray-100">
              Players
            </Link>
            {/* Add more links here as features grow */}
          </nav>
        </div>
        {/* Theme toggle at the bottom */}
        <div className="mt-8 flex flex-col items-center">
          <span className="text-xs text-gray-600 dark:text-gray-300 mb-2">Theme</span>
          <ThemeToggle />
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b flex items-center justify-between px-8 shadow-sm">
          {/* Store info (for TOs, this is their assigned store) */}
          <div className="flex items-center space-x-3">
            <Store className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-100">
              {store ? store.name : 'Loading store...'}
            </span>
          </div>
          {/* User info with dropdown */}
          <div className="relative flex items-center gap-2" ref={dropdownRef}>
            <span className="font-medium text-gray-700 dark:text-gray-100 hidden md:block">
              {userEmail ? `Logged in as: ${userEmail}` : '...'}
            </span>
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
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
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