type Props = {
  children: React.ReactNode;
};
export const FloatingActionsRoot = ({ children }: Props) => (
  <div className="absolute bottom-4 right-4 z-[25] flex flex-col gap-4" id="floating-bot">
    {children}
  </div>
);
