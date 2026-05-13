/** Deterministic HSL hue from a string (for avatar backgrounds) */
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function getAvatarStyle(name: string): { backgroundColor: string; color: string } {
  const hue = stringToHue(name);
  return {
    backgroundColor: `hsl(${hue}, 55%, 88%)`,
    color: `hsl(${hue}, 55%, 30%)`,
  };
}

export function getInitials(name: string, prenume?: string | null): string {
  const parts = prenume
    ? [name, prenume]
    : name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}
