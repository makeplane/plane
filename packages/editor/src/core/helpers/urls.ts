export function validateUrl(input: string): string | null {
  const value = input.trim();

  // allow www.*
  const wwwRegex = /^www\.[^\s/$.?#].[^\s]*$/i;

  // allow only these protocols
  const protocolRegex = /^(https?|rtmps?):\/\/[^\s/$.?#].[^\s]*$/i;

  if (wwwRegex.test(value)) {
    return value; // valid www URL
  }

  if (protocolRegex.test(value)) {
    return value; // valid protocol URL
  }

  return null; // ❌ invalid
}

