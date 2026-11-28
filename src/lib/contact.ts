/** Shared contact helpers used by the public pages. No server-only imports here. */

export function sanitizePhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return "212642539608";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "212" + digits.slice(1);
  }
  if (digits.startsWith("212")) {
    return digits;
  }
  return digits.length > 0 ? digits : "212642539608";
}

/** Dialable international tel: link, even when the stored number is local. */
export function telHref(phone: string | null | undefined): string {
  return `tel:+${sanitizePhoneForWhatsApp(phone)}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
