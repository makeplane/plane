import { SetStateAction, useEffect, useState } from "react";
import { GLOBAL_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
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

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (areFiltersEqual) {
      setIsUpdating(false);
    }
  }, [areFiltersEqual]);

  // Change state while updating view to have a feedback
  const updateButton = isUpdating ? (
    <Button variant="primary" size="sm" className="flex-shrink-0">
      Updating...
    </Button>
  ) : (
    <Button
      variant="primary"
      size="sm"
      className="flex-shrink-0"
      onClick={() => {
        setIsUpdating(true);
        handleUpdateView();
      }}
    >
      Update view
    </Button>
  );

  return (
    <div className="flex gap-2 h-fit">
      {isLocked ? (
        <LockedComponent toolTipContent={lockedTooltipContent} />
      ) : (
        !areFiltersEqual &&
        isAuthorizedUser && (
          <>
            <Button
              variant="outline-primary"
              size="md"
              className="flex-shrink-0"
              data-ph-element={GLOBAL_VIEW_TRACKER_ELEMENTS.HEADER_SAVE_VIEW_BUTTON}
              onClick={() => setIsModalOpen(true)}
            >
              Save as
            </Button>
            {isOwner && <>{updateButton}</>}
          </>
        )
      )}
    </div>
  );
};
