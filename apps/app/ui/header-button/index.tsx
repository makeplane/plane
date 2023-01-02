type HeaderButtonProps = {
  Icon: (
    props: React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  ) => JSX.Element;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  position?: "normal" | "reverse";
};

const HeaderButton = ({
  Icon,
  label,
  disabled = false,
  onClick,
  className = "",
  position = "normal",
}: HeaderButtonProps) => {
  return (
    <>
      <button
        type="button"
        className={`border hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-xs flex items-center gap-x-1 p-2 rounded-md font-medium whitespace-nowrap outline-none ${
          position === "reverse" && "flex-row-reverse"
        } ${className}`}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    </>
  );
};

export default HeaderButton;
