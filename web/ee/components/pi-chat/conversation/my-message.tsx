import { observer } from "mobx-react";
import { cn, PiChatEditor } from "@plane/editor";
import { Avatar, Card, Loader } from "@plane/ui";
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
    <div className="ml-auto mr-0 w-fit flex gap-2" id={id}>
      {!isLoading && (
        <Card className={cn("px-4 py-3 pr-10 w-fit text-base rounded-lg shadow-sm bg-custom-background-100", {})}>
          {/* Message */}
          {!isUserTyping && <PiChatEditor editable={false} content={message} />}
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
      <Avatar size="lg" name={currentUser?.display_name} src={currentUser?.avatar} />
    </div>
  );
});
