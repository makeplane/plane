import * as React from "react";

export type TControlLinkDefaultProps = {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  target?: string;
};

export type TControlLink = TControlLinkDefaultProps & {
  rest?: any;
};

export const ControlLink: React.FC<TControlLink> = (props) => {
  const { href, onClick, children, target = "_self", rest } = props;
  const LEFT_CLICK_EVENT_CODE = 0;

  const _onClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const clickCondition = (event.metaKey || event.ctrlKey) && event.button === LEFT_CLICK_EVENT_CODE;
    if (!clickCondition) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <a href={href} target={target} onClick={_onClick} {...rest}>
      {children}
    </a>
  );
};
