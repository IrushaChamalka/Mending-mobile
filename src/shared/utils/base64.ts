/** Decodes base64url (as used in JWT segments) to a UTF-8 string. Throws on malformed input. */
export function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  // atob returns one character per byte. Percent-encode the bytes so multi-byte UTF-8 decodes correctly.
  let percentEncoded = '';
  for (let index = 0; index < binary.length; index += 1) {
    percentEncoded += `%${binary.charCodeAt(index).toString(16).padStart(2, '0')}`;
  }
  return decodeURIComponent(percentEncoded);
}

/** Encodes a UTF-8 string as base64url (no padding), as used in JWT segments. */
export function encodeBase64Url(input: string): string {
  // Turn each UTF-8 byte into one character so btoa can encode it.
  const binary = encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_match, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
