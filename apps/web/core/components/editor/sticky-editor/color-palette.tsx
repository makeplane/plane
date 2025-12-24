import type { TSticky } from "@plane/types";

export const STICKY_COLORS_LIST: {
  key: string;
  label: string;
  backgroundColor: string;
}[] = [
  {
    key: "gray",
    label: "Gray",
    backgroundColor: "var(--editor-colors-gray-background)",
  },
  {
    key: "peach",
    label: "Peach",
    backgroundColor: "var(--editor-colors-peach-background)",
  },
  {
    key: "pink",
    label: "Pink",
    backgroundColor: "var(--editor-colors-pink-background)",
  },
  {
    key: "orange",
    label: "Orange",
    backgroundColor: "var(--editor-colors-orange-background)",
  },
  {
    key: "green",
    label: "Green",
    backgroundColor: "var(--editor-colors-green-background)",
  },
  {
    key: "light-blue",
    label: "Light blue",
    backgroundColor: "var(--editor-colors-light-blue-background)",
  },
  {
    key: "dark-blue",
    label: "Dark blue",
    backgroundColor: "var(--editor-colors-dark-blue-background)",
  },
  {
    key: "purple",
    label: "Purple",
    backgroundColor: "var(--editor-colors-purple-background)",
  },
];

type TProps = {
  handleUpdate: (data: Partial<TSticky>) => Promise<void>;
};

export function ColorPalette(props: TProps) {
  const { handleUpdate } = props;
  return (
    <div className="absolute z-10 bottom-5 left-0 w-56 shadow p-2 rounded-md bg-surface-1 mb-2">
      <div className="text-13 font-semibold text-placeholder mb-2">Background colors</div>
      <div className="flex flex-wrap gap-2">
        {STICKY_COLORS_LIST.map((color) => (
          <button
            key={color.key}
            type="button"
            onClick={() => {
              handleUpdate({
                background_color: color.key,
              });
            }}
            className="h-6 w-6 rounded-md hover:ring-2 hover:ring-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong transition-all"
            style={{
              backgroundColor: color.backgroundColor,
            }}
          />
        ))}
      </div>
    </div>
  );
}
