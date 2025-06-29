"use client";

export default function AdminLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Welcome to the Admin Panel</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-2">
        Please select a feature from the menu on the left to get started.
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        (In the future, dashboards and admin insights may appear here.)
      </p>
    </div>
  );
} 