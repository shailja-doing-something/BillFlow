"use client";

import { useEffect } from "react";

/**
 * Detects Supabase invite/recovery tokens in the URL hash and
 * redirects to /vault.html so the vault can handle the set-password flow.
 * Runs only when the hash contains type=invite or type=recovery.
 */
export function VaultAuthRedirect() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const type = hash.get("type");
    if (type === "invite" || type === "recovery") {
      window.location.replace("/vault.html" + window.location.hash);
    }
  }, []);

  return null;
}
