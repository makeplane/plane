type HeaderButtonProps = {
  Icon: (
    props: React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  ) => JSX.Element;
  label: string;
  action: () => void;
};

const HeaderButton = ({ Icon, label, action }: HeaderButtonProps) => {
  return (
    <>
      <button
        type="button"
        className="bg-theme text-white border border-indigo-600 text-xs flex items-center gap-x-1 p-2 rounded-md font-medium whitespace-nowrap outline-none"
        onClick={action}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    </>
  );
};

export default HeaderButton;
