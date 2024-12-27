import { FC } from "react";
import { observer } from "mobx-react";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
//
import { IssueLinkDetail } from "./link-detail";
import { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TInitiativeLinkList = {
  initiativeId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
};

export const IssueLinkList: FC<TInitiativeLinkList> = observer((props) => {
  // props
  const { initiativeId, linkOperations, disabled = false } = props;
  // hooks
  const {
    initiative: {
      initiativeLinks: { getInitiativeLinks },
    },
  } = useInitiatives();

  const initiativeLinks = getInitiativeLinks(initiativeId);

  if (!initiativeLinks) return <></>;

  return (
    <div className="space-y-2">
      {initiativeLinks &&
        initiativeLinks.length > 0 &&
        initiativeLinks.map((linkDetail) => (
          <IssueLinkDetail
            key={linkDetail.id}
            linkDetail={linkDetail}
            linkOperations={linkOperations}
            isNotAllowed={disabled}
          />
        ))}
    </div>
  );
});
