import { observer } from "mobx-react";
import { PiChatEditor } from "@plane/editor";
import { Avatar, Card, Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import Typing from "./typing";

type TProps = {
  id: string;
  isUserTyping?: boolean;
  isLoading?: boolean;
  message?: string;
  currentUser: {
    display_name: string;
    avatar: string;
  };
};
export const MyMessage = observer((props: TProps) => {
  const { message, currentUser, isUserTyping = false, id, isLoading = false } = props;

  return (
    <div className="w-full flex gap-4 justify-end" id={id}>
      {!isLoading && (
        <Card
          className={cn(
            "px-4 py-3 pr-10 text-base rounded-lg shadow-sm bg-custom-background-100 w-fit max-w-[75%]",
            {}
          )}
        >
          {/* Message */}
          {!isUserTyping && <PiChatEditor editable={false} content={message} editorClass="!break-words" />}
          {/* Typing */}
          {isUserTyping && (
            <div className="flex gap-2">
              <Typing />
            </div>
          )}
        </Card>
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
