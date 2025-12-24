import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme as useNextTheme } from "next-themes";
// ui
import { Button, getButtonStyling } from "@plane/propel/button";
import { resolveGeneralTheme } from "@plane/utils";
// hooks
import TakeoffIconDark from "@/app/assets/logos/takeoff-icon-dark.svg?url";
import TakeoffIconLight from "@/app/assets/logos/takeoff-icon-light.svg?url";
import { useTheme } from "@/hooks/store";
// icons

export const NewUserPopup = observer(function NewUserPopup() {
  // hooks
  const { isNewUserPopup, toggleNewUserPopup } = useTheme();
  // theme
  const { resolvedTheme } = useNextTheme();

  if (!isNewUserPopup) return <></>;
  return (
    <div className="absolute bottom-8 right-8 p-6 w-96 border border-subtle shadow-md rounded-lg bg-surface-1">
      <div className="flex gap-4">
        <div className="grow">
          <div className="text-14 font-semibold">Create workspace</div>
          <div className="py-2 text-13 font-medium text-tertiary">
            Instance setup done! Welcome to Plane instance portal. Start your journey with by creating your first
            workspace.
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Link href="/workspace/create" className={getButtonStyling("primary", "lg")}>
              Create workspace
            </Link>
            <Button variant="secondary" size="lg" onClick={toggleNewUserPopup}>
              Close
            </Button>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-center">
          <img
            src={resolveGeneralTheme(resolvedTheme) === "dark" ? TakeoffIconDark : TakeoffIconLight}
            height={80}
            width={80}
            alt="Plane icon"
          />
        </div>
      </div>
    </div>
  );
});
