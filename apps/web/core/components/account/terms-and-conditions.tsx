// Check if running in local development
const isLocalDev = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// For self-hosted government deployments, we don't show external legal links
export function TermsAndConditions() {
  // Only show dev credentials hint in local development
  if (!isLocalDev) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 rounded-lg">
        <p className="text-center text-13 font-semibold text-amber-700 dark:text-amber-400 mb-1">
          Local Development Only
        </p>
        <p className="text-center text-13 text-amber-600 dark:text-amber-300">
          <span className="font-mono font-semibold">admin@admin.gov</span>
          <span className="mx-2">/</span>
          <span className="font-mono font-semibold">admin123</span>
        </p>
        <p className="text-center text-11 text-amber-500 dark:text-amber-400/70 mt-1">
          These credentials do not work in production
        </p>
      </div>
    </div>
  );
}
