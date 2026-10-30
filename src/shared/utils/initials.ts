/** "Kasun Fernando" → "KF". Falls back to "?" for empty names. */
export function getInitials(name: string, maxLetters = 2): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, maxLetters)
    .join('');
  return letters.length > 0 ? letters : '?';
}
