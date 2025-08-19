"use client";

export const FormHeader = ({ heading, subHeading }: { heading: string; subHeading: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-2xl font-semibold text-custom-text-100 leading-7">{heading}</span>
    <span className="text-lg font-semibold text-custom-text-400 leading-7">{subHeading}</span>
  </div>
);
