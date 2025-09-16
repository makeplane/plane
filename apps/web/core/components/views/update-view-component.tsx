import { SetStateAction, useEffect, useState } from "react";
import { Button } from "@plane/ui";

type Props = {
  isLocked: boolean;
  areFiltersEqual: boolean;
  isOwner: boolean;
  isAuthorizedUser: boolean;
  setIsModalOpen: (value: SetStateAction<boolean>) => void;
  handleUpdateView: () => void;
  lockedTooltipContent?: string;
  trackerElement: string;
};

export const UpdateViewComponent = (props: Props) => {
  const { isLocked, areFiltersEqual, isOwner, isAuthorizedUser, setIsModalOpen, handleUpdateView, trackerElement } =
    props;

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
      {!isLocked && !areFiltersEqual && isAuthorizedUser && (
        <>
          <Button
            variant="outline-primary"
            size="md"
            className="flex-shrink-0"
            data-ph-element={trackerElement}
            onClick={() => setIsModalOpen(true)}
          >
            Save as
          </Button>
          {isOwner && <>{updateButton}</>}
        </>
      )}
    </div>
  );
};
