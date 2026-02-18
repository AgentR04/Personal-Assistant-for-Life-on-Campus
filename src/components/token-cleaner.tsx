"use client";

export function TokenCleaner() {
  // Disabled: was causing race conditions by clearing test-mode tokens
  // before AuthGuard and Navbar could read them
  return null;
}
