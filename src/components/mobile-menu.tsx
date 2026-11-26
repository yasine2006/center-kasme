"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/** Hamburger + slide-over drawer. Rendered via portal to avoid header backdrop-filter/stacking issues. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  // Derived state: navigating to another page closes the drawer automatically.
  const open = openPath === pathname;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpenPath(null);
    triggerRef.current?.focus();
  }, []);

  // Prevent body scroll and keep keyboard focus inside the drawer while it is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => setOpenPath(pathname)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-sm"
      >
        <Menu size={20} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div ref={dialogRef} className="fixed inset-0 z-[9999] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
            <div className="relative flex h-[100dvh] w-[min(18rem,85vw)] flex-col bg-brand-700 shadow-2xl">
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={close}
                className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
              >
                <X size={18} />
              </button>
              <div className="h-full min-h-0">{children}</div>
            </div>
            <button type="button" aria-label="Fermer" className="h-full flex-1 bg-black/40" onClick={close} />
          </div>,
          document.body,
        )}
    </div>
  );
}
