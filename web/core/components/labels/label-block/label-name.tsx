import { Component } from "lucide-react";

interface ILabelName {
  name: string;
  color: string;
  isGroup: boolean;
}

export const LabelName = (props: ILabelName) => {
  const { name, color, isGroup } = props;

  return (
    <div className="flex items-center gap-3 pr-20">
      {isGroup ? (
        <Component className="h-3.5 w-3.5" color={color} />
      ) : (
        <span
          className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: color && color !== "" ? color : "#000",
          }}
        />
      )}
      <h6 className="text-sm">{name}</h6>
    </div>
  );
};
