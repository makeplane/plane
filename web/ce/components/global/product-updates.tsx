import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// ui
import { CustomMenu } from "@plane/ui";

export type ProductUpdatesProps = {
  setIsChangeLogOpen: (isOpen: boolean) => void;
};

export const ProductUpdates: FC<ProductUpdatesProps> = observer(() => (
  <CustomMenu.MenuItem>
    <Link
      href="https://go.plane.so/p-changelog"
      target="_blank"
      className="flex w-full items-center justify-start text-xs hover:bg-custom-background-80"
    >
      <span className="text-xs">What&apos;s new</span>
    </Link>
  </CustomMenu.MenuItem>
));
