export function slugify(text: string): string {
  const diacritice: Record<string, string> = {
    ă: "a", â: "a", î: "i", ș: "s", ț: "t",
    Ă: "a", Â: "a", Î: "i", Ș: "s", Ț: "t",
  };
  return text
    .split("")
    .map((c) => diacritice[c] || c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
