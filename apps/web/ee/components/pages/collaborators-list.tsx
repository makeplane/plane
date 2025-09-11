import { useRef, useState, useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// helpers
import { useMember } from "@/hooks/store/use-member";
import { TPageInstance } from "@/store/pages/base-page";

interface CollaboratorsListProps {
  page?: TPageInstance;
  initialVisibleCount?: number;
  expandedVisibleCount?: number;
  className?: string;
}

export const CollaboratorsList = observer((props: CollaboratorsListProps) => {
  const { page, initialVisibleCount = 3, expandedVisibleCount = 7, className = "mr-3" } = props;

  const [isGroupHovered, setIsGroupHovered] = useState(false);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const groupHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getUserDetails } = useMember();

  // Cleanup timers on unmount
  useEffect(
    () => () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (groupHoverTimerRef.current) clearTimeout(groupHoverTimerRef.current);
    },
    []
  );

  const handleUserHoverEnter = useCallback(
    (userId: string) => {
      // Clear any existing timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }

      // Set hover with a shorter delay for better responsiveness
      hoverTimerRef.current = setTimeout(() => {
        if (isGroupHovered) {
          setHoveredUserId(userId);
        }
      }, 100);
    },
    [isGroupHovered]
  );

  const handleUserHoverLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setHoveredUserId(null);
  }, []);

  const handleGroupHoverEnter = useCallback(() => {
    if (groupHoverTimerRef.current) {
      clearTimeout(groupHoverTimerRef.current);
    }
    setIsGroupHovered(true);
  }, []);

  const handleGroupHoverLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Add a small delay before collapsing to prevent flaky behavior
    groupHoverTimerRef.current = setTimeout(() => {
      setIsGroupHovered(false);
      setHoveredUserId(null);
    }, 150);
  }, []);

  if (!page || !page.collaborators || page.collaborators.length <= 0) return null;

  const { collaborators } = page;

  const visibleCollaborators = isGroupHovered
    ? collaborators.slice(0, expandedVisibleCount)
    : collaborators.slice(0, initialVisibleCount);

  const remainingCount = Math.max(
    0,
    collaborators.length - (isGroupHovered ? expandedVisibleCount : initialVisibleCount)
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center h-8 self-center select-none ${className}`}
      onMouseEnter={handleGroupHoverEnter}
      onMouseLeave={handleGroupHoverLeave}
    >
      <div className="relative flex items-center transition-all duration-200 ease-out">
        {visibleCollaborators.map((user, index) => {
          const userId = user.id || `user-${index}`;
          const userKey = user.clientId || uuidv4();
          const isHovered = hoveredUserId === userId;

          const memberDetails = getUserDetails(userId);

          if (!memberDetails) return null;

          return (
            <div
              key={userKey}
              className={`transition-all duration-200 ease-out relative cursor-pointer ${
                isGroupHovered ? "ml-1 first:ml-0 translate-x-0 z-10" : `${index > 0 ? "-ml-2.5" : ""} translate-x-0`
              } ${isHovered ? "z-20" : ""}`}
              style={{
                zIndex: isHovered ? 20 : isGroupHovered ? 10 : index + 1,
                transitionDelay: isGroupHovered ? `${index * 30}ms` : "0ms",
              }}
              onMouseEnter={() => handleUserHoverEnter(userId)}
              onMouseLeave={handleUserHoverLeave}
              onClick={() => {
                const otherUserCursor = document.querySelector(`[data-collaborator-id="${userId}"]`);
                if (otherUserCursor) {
                  otherUserCursor.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }}
            >
              <Tooltip tooltipContent={memberDetails.display_name} position="bottom" disabled={!isGroupHovered}>
                <div className="ring-2 ring-custom-background-100 rounded-full transition-all duration-200">
                  <Avatar
                    name={memberDetails.display_name}
                    src={getFileURL(memberDetails.avatar_url)}
                    fallbackBackgroundColor="#0D9488"
                    size="md"
                  />
                </div>
              </Tooltip>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <Tooltip
            tooltipContent={`${remainingCount} more collaborator${remainingCount !== 1 ? "s" : ""}`}
            position="bottom"
          >
            <div
              className={`flex items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 text-xs font-medium ring-2 ring-custom-background-100 transition-all duration-200 ease-out ${
                isGroupHovered
                  ? "w-6 h-6 ml-1 opacity-100 translate-x-0 scale-100"
                  : "-ml-2.5 opacity-100 translate-x-0 scale-100 w-6 h-6"
              }`}
              style={{
                zIndex: isGroupHovered ? 10 : visibleCollaborators.length + 1,
                transitionDelay: isGroupHovered ? `${visibleCollaborators.length * 30}ms` : "0ms",
              }}
            >
              +{remainingCount}
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
