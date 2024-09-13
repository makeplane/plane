export const ImageShimmer: React.FC<{ width: string; height: string }> = ({ width, height }) => (
  <div className="animate-pulse bg-custom-background-80 rounded-md" style={{ width, height }} />
);
