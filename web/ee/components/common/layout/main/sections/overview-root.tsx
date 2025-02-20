"use client";

import React, { FC } from "react";
// local components
import { SectionWrapper } from "../common/section-wrapper";

type TOverviewSectionProps = {
  title: string;
  children: React.ReactNode;
};

export const OverviewSection: FC<TOverviewSectionProps> = (props) => {
  const { children, title } = props;
  return (
    <SectionWrapper>
      <div className="flex items-center">
        <span className="text-base text-custom-text-300 font-medium">{title}</span>
      </div>
      <>{children}</>
    </SectionWrapper>
  );
};
