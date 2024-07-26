import React from "react";
import { Star } from "lucide-react";
// helpers
import { cn } from "../helpers";

type Props = {
  buttonClassName?: string;
  iconClassName?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  selected: boolean;
};

export const FavoriteStar: React.FC<Props> = (props) => {
  const { buttonClassName, iconClassName, onClick, selected } = props;

  return (
    <button type="button" className={cn("h-4 w-4 grid place-items-center", buttonClassName)} onClick={onClick}>
      <Star
        className={cn(
          "h-4 w-4 text-custom-text-300 transition-all",
          {
            "fill-yellow-500 stroke-yellow-500": selected,
          },
          iconClassName
        )}
      />
    </button>
  );
};
