"use client";

export const AuthFormHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-2xl font-semibold text-custom-text-100">{title}</span>
    <span className="text-2xl font-semibold text-custom-text-400">{description}</span>
  </div>
);
