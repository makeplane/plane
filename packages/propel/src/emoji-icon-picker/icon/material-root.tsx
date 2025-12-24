import useFontFaceObserver from "use-font-face-observer";
import { MATERIAL_ICONS_LIST } from "../material-icons";

type MaterialIconListProps = {
  onChange: (value: { name: string; color: string }) => void;
  activeColor: string;
  query: string;
};

export function MaterialIconList(props: MaterialIconListProps) {
  const { query, onChange, activeColor } = props;

  const filteredArray = MATERIAL_ICONS_LIST.filter((icon) => icon.name.toLowerCase().includes(query.toLowerCase()));

  const isMaterialSymbolsFontLoaded = useFontFaceObserver([
    {
      family: `Material Symbols Rounded`,
      style: `normal`,
      weight: `normal`,
      stretch: `condensed`,
    },
  ]);

  return (
    <>
      {filteredArray.map((icon) => (
        <button
          key={icon.name}
          type="button"
          className="h-9 w-9 select-none text-16 grid place-items-center rounded-sm hover:bg-layer-1"
          onClick={() => {
            onChange({
              name: icon.name,
              color: activeColor,
            });
          }}
        >
          {isMaterialSymbolsFontLoaded ? (
            <span style={{ color: activeColor }} className="material-symbols-rounded text-20! leading-5!">
              {icon.name}
            </span>
          ) : (
            <span className="size-5 rounded-sm animate-pulse bg-layer-1" />
          )}
        </button>
      ))}
    </>
  );
}
