type Props = {
  width?: string;
  height?: string;
  className?: string;
  color?: string;
};

export const StateGroupUnstartedIcon: React.FC<Props> = ({
  width = "20",
  height = "20",
  className,
  color = "#3a3a3a",
}) => (
  <svg
    height={height}
    width={width}
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="8" r="7.4" stroke={color} strokeWidth="1.2" />
  </svg>
);
