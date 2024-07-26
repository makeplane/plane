"use client";

import { Input } from "@plane/ui";

type Props = {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
};
export const WebhookInput: React.FC<Props> = (props) => {
  const { value, onChange, hasError } = props;

  return (
    <>
      <h6 className="text-sm font-medium">Payload URL</h6>
      <Input
        type="url"
        className="h-11 w-full"
        onChange={(e) => onChange(e.target.value)}
        value={value}
        autoComplete="off"
        hasError={hasError}
        placeholder="https://example.com/post"
        autoFocus
      />
    </>
  );
};
