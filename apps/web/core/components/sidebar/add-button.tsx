import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";

type Props = React.ComponentProps<"button"> & {
  label: React.ReactNode;
  onClick: () => void;
};

export function SidebarAddButton(props: Props) {
  const { label, onClick, disabled, ...rest } = props;
  return (
    <Button
      variant={"secondary"}
      size={"xl"}
      className="w-full justify-start"
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {label}
    </Button>
  );
}
