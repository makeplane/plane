// react
import React from "react";

const isEmailValid = (email: string) =>
  String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

export const MultiInput = ({ label, name, placeholder, setValue, watch }: any) => {
  const handleKeyDown = (e: any) => {
    if (e.key !== "Enter") return;
    const value = e.target.value;
    if (!value.trim()) return;
    if (isEmailValid(value) && !watch(name)?.find((item: any) => item.email === value)) {
      setValue(name, [...(watch(name) || []), { email: value }]);
      e.target.value = "";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    const value = e.target.value;
    if (!value.trim()) return;
    if (isEmailValid(value) && !watch(name)?.find((item: any) => item.email === value)) {
      setValue(name, [...(watch(name) || []), { email: value }]);
      e.target.value = "";
    } else {
      e.target.value = "";
    }
  };

  const handleChange = (e: any) => {
    const value = e.target.value.trim();
    if (!value) return;
    if (value.includes(",")) {
      const tags = value.split(",");
      tags.forEach((tag: string) => {
        if (isEmailValid(tag) && !watch(name)?.find((item: any) => item.email === tag)) {
          setValue(name, [...(watch(name) || []), { email: tag }]);
        }
      });
      e.target.value = "";
    }
  };

  const removeTag = (index: Number) => {
    setValue(
      name,
      watch(name).filter((_: string, i: any) => i !== index)
    );
  };

  return (
    <>
      {label && <label className="mb-2 text-custom-text-200">{label}</label>}
      <div className="rounded-md border border-custom-border-300 p-2">
        {watch(name)?.map((tag: any, index: number) => (
          <button
            type="button"
            className="m-1.5 rounded-full bg-custom-background-80 px-3 py-2 "
            key={index}
          >
            {tag.email} <span onClick={() => removeTag(index)}>&times;</span>
          </button>
        ))}
        <input
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onChange={handleChange}
          type="text"
          placeholder={placeholder}
          className="block w-full rounded-md bg-transparent p-1.5 text-sm focus:outline-none"
        />
      </div>
    </>
  );
};
