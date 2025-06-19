import { HocuspocusProvider } from "@hocuspocus/provider";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
// types
import { TUserDetails } from "@/types";

export type CollaborationCursorStorage = {
  users: { clientId: number; color: string; name: string }[];
};

type Props = {
  provider: HocuspocusProvider;
  userDetails: TUserDetails;
};

const renderUserCursor = (user: TUserDetails): HTMLSpanElement => {
  const cursor = document.createElement("span");

  cursor.classList.value = "relative border-x -mx-[1px] pointer-events-none break-normal";
  cursor.setAttribute("style", `border-color: ${user.color}`);

  const label = document.createElement("span");
  label.dataset.collaboratorId = user?.id;

  label.classList.value =
    "custom-collaboration-cursor absolute rounded-[3px_3px_3px_0] text-[#0d0d0d] text-xs font-semibold leading-normal -top-[1.3rem] -left-[1px] py-0.5 px-1.5 select-none whitespace-nowrap";
  label.setAttribute("style", `background-color: ${user.color}`);
  label.insertBefore(document.createTextNode(user.name), null);

  const nonBreakingSpace1 = document.createTextNode("\u2060");
  const nonBreakingSpace2 = document.createTextNode("\u2060");
  cursor.insertBefore(nonBreakingSpace1, null);
  cursor.insertBefore(label, null);
  cursor.insertBefore(nonBreakingSpace2, null);
  return cursor;
};

export const CustomCollaborationCursor = (props: Props) => {
  const { provider, userDetails } = props;

  return CollaborationCursor.configure({
    user: userDetails,
    render: renderUserCursor,
    provider,
  });
};
