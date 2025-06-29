"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  useEffect(() => {
    async function confirmEmail() {
      if (token && type === "signup") {
        // Supabase handles confirmation automatically, just show a message
        setTimeout(() => {
          router.replace("/login");
        }, 3000);
      }
    }
    confirmEmail();
  }, [router, token, type]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded shadow p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Confirming your email...</h1>
        <p className="text-gray-600 dark:text-gray-300">Please wait while we confirm your email address. You will be redirected to the login page shortly.</p>
      </div>
    </div>
  );
} 