"use client";

import React from "react";
import { Briefcase, CalendarDays, Link, MessageSquare, Network, Paperclip, Users } from "lucide-react";
import { InitiativeIcon } from "@plane/ui";
import { TInitiativeActivity } from "@/plane-web/types/initiative";

const iconMap = {
  name: MessageSquare,
  initiative: InitiativeIcon,
  description: MessageSquare,
  lead: Users,
  start_date: CalendarDays,
  end_date: CalendarDays,
  link: Link,
  attachment: Paperclip,
  projects: Briefcase,
} as const;

interface InitiativeActivityIconProps {
  activity: TInitiativeActivity | null;
}

export const InitiativeActivityIcon = ({ activity }: InitiativeActivityIconProps) => {
  if (!activity?.field) return <Users className="size-3.5 text-custom-text-200" aria-hidden="true" />;

  const Icon = iconMap[activity.field as keyof typeof iconMap] || Network;

  return <Icon className="size-3.5 text-custom-text-200" aria-hidden="true" />;
};
