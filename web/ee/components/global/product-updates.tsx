import { FC } from "react";
import { observer } from "mobx-react";
// ui
import { CustomMenu } from "@plane/ui";

export type ProductUpdatesProps = {
  setIsChangeLogOpen: (isOpen: boolean) => void;
};

export const ProductUpdates: FC<ProductUpdatesProps> = observer((props) => {
  const { setIsChangeLogOpen } = props;

  return (
    <CustomMenu.MenuItem>
      <button
        type="button"
        onClick={() => setIsChangeLogOpen(true)}
        className="flex w-full items-center justify-start text-xs hover:bg-custom-background-80"
      >
        <span className="text-xs">What&apos;s new?</span>
      </button>
    </CustomMenu.MenuItem>
  );
});
