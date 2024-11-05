import { IUser } from "@plane/types";
import SystemPrompts from "../system-prompts";

type TProps = {
  currentUser: IUser | undefined;
};
export const NewConversation = (props: TProps) => {
  const { currentUser } = props;

  return (
    <div className="m-auto">
      <div className="text-center text-3xl font-bold text-gray-300">Hey, {currentUser?.first_name}! </div>
      <div className="text-center text-2xl font-semibold text-slate-600">How can I help you today?</div>
      {/* Templates */}
      <SystemPrompts userId={currentUser?.id} />
    </div>
  );
};
