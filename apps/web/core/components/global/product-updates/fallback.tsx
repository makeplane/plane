import { EmptyStateDetailed } from "@plane/propel/empty-state";

type TProductUpdatesFallbackProps = {
  description: string;
  variant: "cloud" | "self-managed";
};

export function ProductUpdatesFallback(props: TProductUpdatesFallbackProps) {
  const { description, variant } = props;
  // derived values
  const changelogUrl =
    variant === "cloud"
      ? "https://plane.so/changelog?category=cloud"
      : "https://plane.so/changelog?category=self-hosted";

  return (
    <div className="py-8">
      <EmptyStateDetailed
        assetKey="changelog"
        description={description}
        align="center"
        actions={[
          {
            label: "Go to changelog",
            variant: "primary",
            onClick: () => window.open(changelogUrl, "_blank"),
          },
        ]}
      />
    </div>
  );
}
