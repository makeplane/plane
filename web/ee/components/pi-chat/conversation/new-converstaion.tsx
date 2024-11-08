import { IUser } from "@plane/types";
import { TTemplate } from "@/plane-web/types";
import SystemPrompts from "../system-prompts";

type TProps = {
  currentUser: IUser | undefined;
  templates: TTemplate[] | undefined;
};
export const NewConversation = (props: TProps) => {
  const { currentUser, templates } = props;

  return (
    <div className="m-auto">
      <div className="text-center text-3xl font-bold text-custom-text-400">Hey, {currentUser?.first_name}! </div>
      <div className="text-center text-2xl font-semibold text-custom-text-300">How can I help you today?</div>
      {/* Templates */}
      <SystemPrompts userId={currentUser?.id} templates={templates} />
    </div>
  );
};
