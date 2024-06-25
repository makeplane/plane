import { SetStateAction } from "react";
import { Button } from "@plane/ui";
import { LockedComponent } from "../icons/locked-component";

type Props = {
  isLocked: boolean;
  areFiltersEqual: boolean;
  isOwner: boolean;
  isAuthorizedUser: boolean;
  setIsModalOpen: (value: SetStateAction<boolean>) => void;
  handleUpdateView: () => void;
  lockedTooltipContent?: string;
};

export const UpdateViewComponent = (props: Props) => {
  const {
    isLocked,
    areFiltersEqual,
    isOwner,
    isAuthorizedUser,
    setIsModalOpen,
    handleUpdateView,
    lockedTooltipContent,
  } = props;
  return (
    <div className="flex gap-2">
      {isLocked ? (
        <LockedComponent toolTipContent={lockedTooltipContent} />
      ) : (
        !areFiltersEqual &&
        isAuthorizedUser && (
          <>
            <Button variant="outline-primary" size="sm" className="flex-shrink-0" onClick={() => setIsModalOpen(true)}>
              Save as
            </Button>
            {isOwner && (
              <Button variant="primary" size="sm" className="flex-shrink-0" onClick={handleUpdateView}>
                Update view
              </Button>
            )}
          </>
        )
      )}
    </div>
  );
};
