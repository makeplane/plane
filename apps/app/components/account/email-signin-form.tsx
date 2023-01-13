import { useState, FC } from "react";
import { KeyIcon } from "@heroicons/react/24/outline";
// components
import { EmailCodeForm, EmailPasswordForm } from "components/account";

export interface EmailSignInFormProps {
  handleSuccess: () => void;
}

export const EmailSignInForm: FC<EmailSignInFormProps> = (props) => {
  const { handleSuccess } = props;
  // states
  const [useCode, setUseCode] = useState(true);

  return (
    <>
      {useCode ? (
        <EmailCodeForm onSuccess={handleSuccess} />
      ) : (
        <EmailPasswordForm onSuccess={handleSuccess} />
      )}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or</span>
          </div>
        </div>
        <div className="mt-6 flex w-full flex-col items-stretch gap-y-2">
          <button
            type="button"
            className="flex w-full items-center rounded border border-gray-300 px-3 py-2 text-sm duration-300 hover:bg-gray-100"
            onClick={() => setUseCode((prev) => !prev)}
          >
            <KeyIcon className="h-[25px] w-[25px]" />
            <span className="w-full text-center font-medium">
              {useCode ? "Continue with Password" : "Continue with Code"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
