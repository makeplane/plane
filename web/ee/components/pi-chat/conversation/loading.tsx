import { useEffect } from "react";
import { observer } from "mobx-react";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { cn } from "@plane/editor";
import { TChatHistory } from "@/plane-web/types";
import { AiMessage } from "./ai-message";
import { MyMessage } from "./my-message";

type TProps = {
  isLoading: boolean;
  isFullScreen: boolean;
  currentUser: {
    display_name: string;
    avatar: string;
  };
};

export const Loading = observer((props: TProps) => {
  const { isLoading, isFullScreen, currentUser } = props;

  return (
    <div
      className={cn("flex flex-col gap-8 max-h-full h-full overflow-y-scroll w-[90%] mx-auto pb-[230px]", {
        "md:w-[70%]": isFullScreen,
      })}
    >
      {/* Loading */}
      {isLoading && <MyMessage isLoading={isLoading} currentUser={currentUser} id={""} />}
      {isLoading && <AiMessage isLoading={isLoading} id={""} />}
    </div>
  );
});
