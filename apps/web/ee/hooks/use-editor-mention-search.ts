import { useCallback } from "react";
// plane types
import { TSearchEntityRequestPayload, TUserSearchResponse } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store";

type TArgs = {
  memberIds: string[];
};

export const useEditorMentionSearch = (args: TArgs) => {
  const { memberIds } = args;
  // store hooks
  const { getUserDetails } = useMember();

  const searchEntity = useCallback(
    async (payload: TSearchEntityRequestPayload) => {
      let items: TUserSearchResponse[] = memberIds.map((userId) => {
        const userDetails = getUserDetails(userId);
        return {
          member__avatar_url: userDetails?.avatar_url ?? "",
          member__display_name: userDetails?.display_name ?? "",
          member__id: userDetails?.id ?? "",
        };
      });
      items = items.filter((u) => u.member__display_name.toLowerCase().includes(payload.query.toLowerCase()));
      return {
        user_mention: items,
      };
    },
    [getUserDetails, memberIds]
  );

  return {
    searchEntity,
  };
};
