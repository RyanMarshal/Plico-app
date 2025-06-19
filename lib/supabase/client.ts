// This client is used in the browser (in 'use client' components).
// Re-export from singleton to ensure only one instance is created
export {
  createSupabaseBrowserClient,
  getSupabaseSingleton,
} from "./singleton-client";
