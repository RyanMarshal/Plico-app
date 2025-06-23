"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("Poll page error:", error);

    // In production, you could send this to an error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to error tracking service
      // logErrorToService({
      //   message: error.message,
      //   stack: error.stack,
      //   digest: error.digest,
      //   page: 'poll',
      //   url: window.location.href,
      //   timestamp: new Date().toISOString(),
      // });
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">Error: {error.message}</p>
        <details className="mb-6 text-left max-w-2xl mx-auto">
          <summary className="cursor-pointer text-sm text-gray-500">
            Error details
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {error.stack}
          </pre>
        </details>
        <button
          onClick={reset}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
