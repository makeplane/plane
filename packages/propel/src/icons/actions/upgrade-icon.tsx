import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function UpgradeIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM5.00457 7.55003L7.55003 5.00457C7.79853 4.75605 8.20147 4.75605 8.44997 5.00457L10.9954 7.55003C11.2439 7.79853 11.2439 8.20147 10.9954 8.44997C10.7469 8.69847 10.344 8.69847 10.0955 8.44997L8.63636 6.99085V10.5455C8.63636 10.8969 8.35146 11.1818 8 11.1818C7.64854 11.1818 7.36364 10.8969 7.36364 10.5455V6.99085L5.90452 8.44997C5.65601 8.69847 5.25309 8.69847 5.00457 8.44997C4.75605 8.20147 4.75605 7.79853 5.00457 7.55003Z"
        fill={color}
      />
    </IconWrapper>
  );
}
