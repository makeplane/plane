// Product updates fallback disabled for government deployment
// Original linked to plane.so/changelog

type TProductUpdatesFallbackProps = {
  description: string;
  variant: "cloud" | "self-managed";
};

export function ProductUpdatesFallback(_props: TProductUpdatesFallbackProps) {
  return null;
}
