import { TSticky } from "@plane/types";

export const STICKY_COLORS = [
  "#D4DEF7", // light periwinkle
  "#B4E4FF", // light blue
  "#FFF2B4", // light yellow
  "#E3E3E3", // light gray
  "#FFE2DD", // light pink
  "#F5D1A5", // light orange
  "#D1F7C4", // light green
  "#E5D4FF", // light purple
];

type TProps = {
  handleUpdate: (data: Partial<TSticky>) => Promise<void>;
};

export const ColorPalette = (props: TProps) => {
  const { handleUpdate } = props;
  return (
    <div className="absolute z-10 bottom-5 left-0 w-56 shadow p-2 rounded-md bg-custom-background-100 mb-2">
      <div className="text-sm font-semibold text-custom-text-400 mb-2">Background colors</div>
      <div className="flex flex-wrap gap-2">
        {STICKY_COLORS.map((color, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleUpdate({ color })}
            className="h-6 w-6 rounded-md hover:ring-2 hover:ring-custom-primary focus:outline-none focus:ring-2 focus:ring-custom-primary transition-all"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};
