import type { FC } from "react";

type Props = {
  title: string;
  description: string;
};

export function CommonOnboardingHeader({ title, description }: Props) {
  return (
    <div className="text-left space-y-2">
      <h1 className="text-h4-semibold text-primary">{title}</h1>
      <p className="text-body-md-regular text-tertiary">{description}</p>
    </div>
  );
}
