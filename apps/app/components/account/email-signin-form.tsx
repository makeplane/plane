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
    </>
  );
};
