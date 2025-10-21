declare module "next/head" {
  // Minimal shim for next/head - in React Router use react-helmet or similar
  const Head: React.FC<{ children?: React.ReactNode }>;
  export default Head;
}
