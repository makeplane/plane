import * as React from "react";

export type TControlLink = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  target?: string;
  disabled?: boolean;
  className?: string;
};

export const ControlLink = React.forwardRef<HTMLAnchorElement, TControlLink>((props, ref) => {
  const { href, onClick, children, target = "_self", disabled = false, className, ...rest } = props;
  const LEFT_CLICK_EVENT_CODE = 0;

  const handleOnClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const clickCondition = (event.metaKey || event.ctrlKey) && event.button === LEFT_CLICK_EVENT_CODE;
    if (!clickCondition) {
      event.preventDefault();
      onClick();
    }
  };

  if (disabled) return <>{children}</>;

  return (
    <a href={href} target={target} onClick={handleOnClick} {...rest} ref={ref} className={className}>
      {children}
    </a>
  );
});
