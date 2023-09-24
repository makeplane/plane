type Props = {
  width?: string;
  height?: string;
  className?: string;
  color?: string;
};

export const StateGroupBacklogIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "#a3a3a3",
}) => (
  <svg
    height={height}
    width={width}
    className={className}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="6" cy="6" r="5.6" stroke={color} strokeWidth="0.8" strokeDasharray="4 4" />
  </svg>
);
