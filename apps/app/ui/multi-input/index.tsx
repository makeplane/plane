// react
import React from "react";
// common
import { classNames } from "constants/common";

const MultiInput = ({ label, name, placeholder, setValue, watch, validateInput }: any) => {
  const handleKeyDown = (e: any) => {
    if (e.key !== "Enter") return;
    const value = e.target.value;
    if (!value.trim()) return;
    if (
      validateInput &&
      validateInput(value) &&
      !watch(name)?.find((item: any) => item.email === value)
    ) {
      setValue(name, [...(watch(name) || []), { email: value }]);
      e.target.value = "";
    }
  };
  const removeTag = (index: Number) => {
    setValue(
      name,
      watch(name).filter((el: string, i: any) => i !== index)
    );
  };
  return (
    <>
      {label && <label className="mb-2 text-gray-500">{label}</label>}
      <div className="rounded-md border p-2">
        {watch(name)?.map((tag: any, index: any) => (
          <button className="bg-slate-300 rounded-full p-1.5 m-1.5" key={index}>
            {tag.email} <span onClick={() => removeTag(index)}>&times;</span>
          </button>
        ))}
        <input
          onKeyDown={handleKeyDown}
          type="text"
          placeholder={placeholder}
          className={classNames("block rounded-md bg-transparent text-sm focus:outline-none p-1.5")}
        />
      </div>
    </>
  );
};

export default MultiInput;
