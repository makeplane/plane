import React from "react";
import Image from "next/image";

// icon
import { PlusIcon } from "@heroicons/react/24/outline";
// helper
import { capitalizeFirstLetter } from "helpers/string.helper";

type Props = {
  type: "cycle" | "module" | "project" | "issue";
  title: string;
  description: React.ReactNode | string;
  imgURL: string;
};

export const EmptyState: React.FC<Props> = ({ type, title, description, imgURL }) => {
  const shortcutKey = (type: string) => {
    switch (type) {
      case "cycle":
        return "Q";
      case "module":
        return "M";
      case "project":
        return "P";
      default:
        return "C";
    }
  };
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 text-center">
      <div className="h-32 w-72">
        <Image src={imgURL} height="128" width="288" alt={type} />
      </div>

      <h3 className="text-xl font-semibold">{title}</h3>
      <span>
        Use shortcut{" "}
        <span className="rounded-sm mx-1 border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800">
          {shortcutKey(type)}
        </span>{" "}
        to create {type} from anywhere.
      </span>
      <p className="max-w-md text-sm text-gray-500">{description}</p>

      <button
        className="flex items-center gap-1 rounded-lg bg-theme px-2.5 py-2 text-sm text-white"
        onClick={() => {
          const e = new KeyboardEvent("keydown", {
            key: shortcutKey(type),
          });
          document.dispatchEvent(e);
        }}
      >
        <PlusIcon className="h-4 w-4 font-bold text-white" />
        Create New {capitalizeFirstLetter(type)}
      </button>
    </div>
  );
};
