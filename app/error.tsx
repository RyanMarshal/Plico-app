"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Global error occurred
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;re sorry, but something unexpected happened.
            </p>
            <details className="mb-6 text-left max-w-2xl mx-auto">
              <summary className="cursor-pointer text-sm text-gray-500">
                Technical details
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
            <button
              onClick={reset}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
