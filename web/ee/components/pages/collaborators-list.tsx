import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Avatar, Tooltip } from "@plane/ui";
// helpers
import { getFileURL  } from "@plane/utils";
import { useMember, useUser } from "@/hooks/store";
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

  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();

  const collaborators = page?.collaborators || [];

  if (collaborators.length <= 0) return null;

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
      onMouseEnter={() => setIsGroupHovered(true)}
      onMouseLeave={() => {
        setIsGroupHovered(false);
        setHoveredUserId(null);
      }}
    >
      <div className="relative flex items-center transition-all duration-300 ease-in-out">
        {visibleCollaborators.map((user, index) => {
          const userId = user.id || `user-${index}`;
          const isHovered = hoveredUserId === userId;

          const memberDetails = getUserDetails(userId);
          const isCurrentUser = userId === currentUser?.id;

          if (!memberDetails) return null;

          return (
            <div
              key={userId}
              className={`transition-all duration-300 ease-in-out relative cursor-pointer ${
                isGroupHovered
                  ? "ml-2 first:ml-0 translate-x-0 z-10 hover:scale-105"
                  : `${index > 0 ? "-ml-2.5" : ""} translate-x-0`
              }`}
              style={{
                zIndex: isHovered ? 20 : isGroupHovered ? 10 : collaborators.length - index,
                transitionDelay: isGroupHovered ? `${index * 40}ms` : "0ms",
              }}
              onMouseEnter={() => {
                const timer = setTimeout(() => {
                  if (isGroupHovered) setHoveredUserId(userId);
                }, 300);
                return () => clearTimeout(timer);
              }}
              onMouseLeave={() => setHoveredUserId(null)}
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
              <div className="ring-2 ring-custom-background-100 rounded-full">
                <Avatar
                  name={memberDetails.display_name}
                  src={getFileURL(memberDetails.avatar_url)}
                  fallbackBackgroundColor="#0D9488"
                  size="md"
                />
              </div>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <Tooltip
            tooltipContent={`${remainingCount} more collaborator${remainingCount !== 1 ? "s" : ""}`}
            position="bottom"
          >
            <div
              className={`flex items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 text-xs font-medium ring-2 ring-custom-background-100 transition-all duration-300 ease-out ${
                isGroupHovered
                  ? "w-6 h-6 ml-2 opacity-100 translate-x-0 scale-100"
                  : "-ml-2.5 opacity-100 translate-x-0 scale-100 w-6 h-6"
              }`}
              style={{
                zIndex: isGroupHovered ? 10 : 0,
                transitionDelay: isGroupHovered ? `${visibleCollaborators.length * 40}ms` : "0ms",
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
