/** RFC 4122 v4 shape, which is what the API validates the client message id against. */
const UUID_V4_TEMPLATE = "10000000-1000-4000-8000-100000000000";

type TRandomSource = Pick<Crypto, "randomUUID" | "getRandomValues">;

const randomByte = (source: Partial<TRandomSource> | undefined): number => {
  if (source?.getRandomValues) return source.getRandomValues(new Uint8Array(1))[0];
  return Math.floor(Math.random() * 256);
};

/**
 * The reply endpoint dedupes on `client_message_id`, so every submit needs its own id.
 * `crypto.randomUUID` only exists in secure contexts, hence the manual fallback.
 */
export function createClientMessageId(source: Partial<TRandomSource> | undefined = globalThis.crypto): string {
  if (source?.randomUUID) return source.randomUUID();

  return UUID_V4_TEMPLATE.replace(/[018]/g, (character) => {
    const digit = Number(character);
    return (digit ^ (randomByte(source) & (15 >> (digit / 4)))).toString(16);
  });
}
