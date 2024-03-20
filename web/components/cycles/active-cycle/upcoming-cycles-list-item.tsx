import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Star, User2 } from "lucide-react";
// hooks
import { Avatar, AvatarGroup, setPromiseToast } from "@plane/ui";
import { CycleQuickActions } from "@/components/cycles";
import { CYCLE_FAVORITED, CYCLE_UNFAVORITED } from "@/constants/event-tracker";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { useCycle, useEventTracker, useMember } from "@/hooks/store";
// components
// ui
// helpers
// constants

type Props = {
  cycleId: string;
};

export const UpcomingCycleListItem: React.FC<Props> = observer((props) => {
  const { cycleId } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { captureEvent } = useEventTracker();
  const { addCycleToFavorites, getCycleById, removeCycleFromFavorites } = useCycle();
  const { getUserDetails } = useMember();
  // derived values
  const cycle = getCycleById(cycleId);

  const handleAddToFavorites = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const addToFavoritePromise = addCycleToFavorites(workspaceSlug?.toString(), projectId.toString(), cycleId).then(
      () => {
        captureEvent(CYCLE_FAVORITED, {
          cycle_id: cycleId,
          element: "List layout",
          state: "SUCCESS",
        });
      }
    );

    setPromiseToast(addToFavoritePromise, {
      loading: "Adding cycle to favorites...",
      success: {
        title: "Success!",
        message: () => "Cycle added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the cycle to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const removeFromFavoritePromise = removeCycleFromFavorites(
      workspaceSlug?.toString(),
      projectId.toString(),
      cycleId
    ).then(() => {
      captureEvent(CYCLE_UNFAVORITED, {
        cycle_id: cycleId,
        element: "List layout",
        state: "SUCCESS",
      });
    });

    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing cycle from favorites...",
      success: {
        title: "Success!",
        message: () => "Cycle removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the cycle from favorites. Please try again.",
      },
    });
  };

  if (!cycle) return null;

  return (
    <Link
      href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`}
      className="py-5 px-2 flex items-center justify-between gap-2 hover:bg-custom-background-90"
    >
      <h6 className="font-medium text-base">{cycle.name}</h6>
      <div className="flex items-center gap-4">
        {cycle.start_date && cycle.end_date && (
          <div className="text-xs text-custom-text-300">
            {renderFormattedDate(cycle.start_date)} - {renderFormattedDate(cycle.end_date)}
          </div>
        )}
        {cycle.assignee_ids?.length > 0 ? (
          <AvatarGroup showTooltip={false}>
            {cycle.assignee_ids?.map((assigneeId) => {
              const member = getUserDetails(assigneeId);
              return <Avatar key={member?.id} name={member?.display_name} src={member?.avatar} />;
            })}
          </AvatarGroup>
        ) : (
          <span className="flex h-5 w-5 items-end justify-center rounded-full border border-dashed border-custom-text-400 bg-custom-background-80">
            <User2 className="h-4 w-4 text-custom-text-400" />
          </span>
        )}

        {cycle.is_favorite ? (
          <button type="button" onClick={handleRemoveFromFavorites}>
            <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
          </button>
        ) : (
          <button type="button" onClick={handleAddToFavorites}>
            <Star className="h-3.5 w-3.5 text-custom-text-200" />
          </button>
        )}

        {workspaceSlug && projectId && (
          <CycleQuickActions
            cycleId={cycleId}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
        )}
      </div>
    </Link>
  );
});
