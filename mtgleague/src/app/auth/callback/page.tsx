"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || null;

  useEffect(() => {
    async function handleRedirect() {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      // Get user role
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
          (role === "tournament_organiser" && redirectTo.startsWith("/to"))
        ) {
          router.push(redirectTo);
          return;
        }
      }
      // Otherwise, redirect by role
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "tournament_organiser") {
        router.push("/to");
      } else {
        router.push("/");
      }
    }
    handleRedirect();
  }, [router, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded shadow p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Signing you in...</h1>
        <p className="text-gray-600 dark:text-gray-300">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
} 