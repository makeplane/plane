"use client";

import React, { FC } from "react";
import omit from "lodash/omit";
// constants
import { STATE_ANALYTICS_DETAILS } from "@plane/constants";
// types
import { TStateAnalytics } from "@plane/types";
// ui
import { LinearProgressIndicator } from "@plane/ui";
// utils
import { cn } from "@plane/utils";
// local components
import { SectionWrapper } from "../common/section-wrapper";

type TProgressSectionProps = {
  title?: string;
  data: TStateAnalytics;
};

interface IProgressIndicatorData {
  id: number;
  name: string;
  value: number;
  color: string;
  percentage: number;
}

type TProgressItemProps = {
  data: IProgressIndicatorData;
  showSeparator?: boolean;
};

export const ProgressItem: FC<TProgressItemProps> = ({ data, showSeparator }) => {
  const itemContent = (
    <div
      className={cn("flex flex-col gap-1 px-3 py-2 min-w-24", {
        "flex-1": !showSeparator,
      })}
    >
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-sm flex-shrink-0"
          style={{
            backgroundColor: data.color,
          }}
        />
        <span className="text-sm font-medium leading-4">{data.name}</span>
      </div>
      <div className="flex gap-3">
        <span className="text-md font-bold">{data.value}</span>
        <span className="text-sm font-medium text-custom-text-350 my-auto">{Math.round(data.percentage)}%</span>
      </div>
    </div>
  );

  if (!showSeparator) return itemContent;

  return (
    <div className="relative border-l-2 pl-10 flex-1">
      <div className="absolute -left-2 top-5 font-medium text-custom-text-350 rotate-[270deg] text-[10px] tracking-widest">
        STATUS
      </div>
      {itemContent}
    </div>
  );
};

export const ProgressSection: FC<TProgressSectionProps> = (props) => {
  const { title = "Progress", data } = props;

  const totalIssues = data ? Object.values(omit(data, "overdue_issues")).reduce((acc, val) => acc + val, 0) : 0;

  const progressIndicatorData: IProgressIndicatorData[] = STATE_ANALYTICS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: data ? data[group.key] : 0,
    color: group.color,
    percentage: data ? (data[group.key] / totalIssues) * 100 : 0,
  }));

  return (
    <SectionWrapper>
      <div className="flex items-center">
        <h3 className="text-base text-custom-text-300 font-medium">{title}</h3>
      </div>

      <div className="flex flex-col gap-4">
        <LinearProgressIndicator
          size="xl"
          data={progressIndicatorData}
          barClassName="first:rounded last:rounded rounded"
          className="bg-transparent gap-0.5 rounded p-0"
        />

        <div className="flex gap-4 justify-stretch flex-wrap w-full">
          {progressIndicatorData.map((item, index) => (
            <ProgressItem key={item.id} data={item} showSeparator={index === 1} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
