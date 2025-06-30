"use client";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || null;

  useEffect(() => {
    document.title = "Login | MtgLeague";
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Fetch user role from users table
        const { data: userRows } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        const role = userRows?.role;
        // If redirectTo is present and permitted, use it
        if (redirectTo) {
          if (
            (role === "admin" && redirectTo.startsWith("/admin")) ||
            (role === "to" && redirectTo.startsWith("/to"))
          ) {
            router.push(redirectTo);
            return;
          }
        }
        // Otherwise, redirect by role
        if (role === "admin") {
          router.push("/admin");
        } else if (role === "to") {
          router.push("/to");
        } else {
          router.push("/");
        }
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded shadow p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Sign In</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                  inputBorder: '#d1d5db',
                  inputBackground: '#f9fafb',
                  inputText: '#111827',
                  inputLabelText: '#374151',
                  messageText: '#ef4444',
                  ...{
                    dark: {
                      brand: '#2563eb',
                      brandAccent: '#60a5fa',
                      inputBorder: '#374151',
                      inputBackground: '#1f2937',
                      inputText: '#f3f4f6',
                      inputLabelText: '#d1d5db',
                      messageText: '#f87171',
                    }
                  }
                }
              }
            }
          }}
          providers={["google"]}
          theme={"auto"}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
} 