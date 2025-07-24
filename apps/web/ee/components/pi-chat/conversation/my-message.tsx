import { observer } from "mobx-react";
import { PiChatEditor } from "@plane/editor";
import { IUser } from "@plane/types";
import { Avatar, Card, Loader } from "@plane/ui";
import { cn } from "@plane/utils";

type TProps = {
  id: string;
  isLoading?: boolean;
  message?: string;
  currentUser: IUser | undefined;
};
export const MyMessage = observer((props: TProps) => {
  const { message, currentUser, id, isLoading = false } = props;

  return (
    <div className="w-full flex gap-4 justify-end" id={id}>
      {!isLoading && (
        <div className={cn("px-4 py-3 pr-10 text-base rounded-lg bg-custom-background-90 w-fit max-w-[75%]")}>
          {/* Message */}
          <PiChatEditor editable={false} content={message} editorClass="!break-words" />
        </div>
      )}
      {/* Loading */}
      {isLoading && (
        <Loader>
          <Loader.Item width="50px" height="42px" />
        </Loader>
      )}
      {/* Avatar */}
      <Avatar name={currentUser?.display_name} src={currentUser?.avatar} size={36} className="text-base" />
    </div>
  );
});
