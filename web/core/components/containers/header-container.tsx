interface Props {
  children: string | JSX.Element | JSX.Element[];
}
const HeaderContainer = ({ children }: Props) => (
  <div className="relative z-10 flex w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 !bg-blue-200">
    {children}
  </div>
);

const LeftItem = ({ children }: Props) => (
  <div className="flex flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">{children}</div>
);
const RightItem = ({ children }: Props) => <div className="w-full flex items-center justify-end gap-3">{children}</div>;

HeaderContainer.LeftItem = LeftItem;
HeaderContainer.RightItem = RightItem;
HeaderContainer.displayName = "core-header-container";

export { HeaderContainer };
