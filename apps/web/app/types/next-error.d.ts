declare module "next/error" {
  // Minimal shim for next/error
  const NextError: React.ComponentType<{ statusCode: number }>;
  export default NextError;
}
