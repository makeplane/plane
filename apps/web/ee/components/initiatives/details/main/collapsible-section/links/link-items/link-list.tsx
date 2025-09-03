import { FC } from "react";
import { observer } from "mobx-react";
// PLane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
//
import { IssueLinkItem } from "./link-item";
import { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

type TLinkList = {
  initiativeId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
};

export const LinkList: FC<TLinkList> = observer((props) => {
  // props
  const { initiativeId, linkOperations, disabled = false } = props;
  // hooks
  const {
    initiative: {
      initiativeLinks: { getInitiativeLinks },
    },
  } = useInitiatives();

  const links = getInitiativeLinks(initiativeId);

  if (!links) return null;

  return (
    <div className="flex flex-col gap-2 py-4">
      {links.map((link) => (
        <IssueLinkItem key={link.id} link={link} linkOperations={linkOperations} isNotAllowed={disabled} />
      ))}
    </div>
  );
});
