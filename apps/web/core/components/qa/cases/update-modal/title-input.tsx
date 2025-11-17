"use client";
import React from "react";

type TitleInputProps = {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
};

export function TitleInput({ value, onChange, onBlur }: TitleInputProps) {
  return (
    <div className="mb-5">
      <input
        type="text"
        className="w-full rounded-md border border-transparent bg-white px-3 py-2 text-xl  focus:outline-none hover:border-black focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
        placeholder="请输入用例标题"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}
