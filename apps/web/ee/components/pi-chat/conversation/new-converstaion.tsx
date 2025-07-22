import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { IUser } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import SystemPrompts from "../system-prompts";

type TProps = {
  currentUser: IUser | undefined;
  isFullScreen: boolean;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
};
export const NewConversation = observer((props: TProps) => {
  const { currentUser, isFullScreen, shouldRedirect = true, isProjectLevel = false } = props;
  // store hooks
  const { getTemplates } = usePiChat();
  const { data: templates, isLoading } = useSWR("PI_TEMPLATES", () => getTemplates(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });
  // state
  const [isInitializing, setIsInitializing] = useState<string | null>(null);

  if (!currentUser) return null;

  return (
    <div
      className={cn("m-auto", {
        "mt-[40%]": !isFullScreen,
      })}
    >
      <div className="text-center text-3xl font-bold text-custom-text-200">Hey, {currentUser?.display_name}! </div>
      <div className="text-center text-2xl font-semibold text-custom-text-400">How can I help you today?</div>
      {/* Templates */}
      {isLoading ? (
        <div className="flex gap-4 flex-wrap m-auto justify-center mt-6">
          <Loader className="flex flex-wrap m-auto justify-center gap-6">
            <Loader.Item width="250px" height="90px" />
            <Loader.Item width="250px" height="90px" />
            <Loader.Item width="250px" height="90px" />
          </Loader>
        </div>
      ) : (
        <div className="flex gap-4 flex-wrap m-auto justify-center mt-6">
          {templates?.map((prompt, index) => (
            <SystemPrompts
              key={index}
              prompt={prompt}
              shouldRedirect={shouldRedirect}
              isProjectLevel={isProjectLevel}
              isInitializing={isInitializing === prompt.text}
              setIsInitializing={(value) => setIsInitializing(value)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
