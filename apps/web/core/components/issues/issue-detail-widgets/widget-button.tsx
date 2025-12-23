import type { FC } from "react";
import React from "react";
// helpers
import { Button } from "@plane/propel/button";

type Props = {
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
};

export function IssueDetailWidgetButton(props: Props) {
  const { icon, title, disabled = false } = props;
  return (
    <Button variant={"secondary"} disabled={disabled} size="lg">
      {icon && icon}
      <span className="text-body-xs-medium">{title}</span>
    </Button>
  );
}
