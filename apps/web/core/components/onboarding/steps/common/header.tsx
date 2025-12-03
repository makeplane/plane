import type { FC } from "react";

type Props = {
  title: string;
  description: string;
};

export function CommonOnboardingHeader({ title, description }: Props) {
  return (
    <div className="text-left space-y-2">
      <h1 className="text-2xl font-semibold text-secondary">{title}</h1>
      <p className="text-base text-tertiary">{description}</p>
    </div>
  );
}
