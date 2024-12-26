export type CommandListInstance = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type TArgs = {
  event: KeyboardEvent;
  sections: {
    items: any[];
  }[];
  selectedIndex: {
    section: number;
    item: number;
  };
};

export const DROPDOWN_NAVIGATION_KEYS = ["ArrowUp", "ArrowDown", "Enter"];

export const getNextValidIndex = (
  args: TArgs
):
  | {
      section: number;
      item: number;
    }
  | undefined => {
  const { event, sections, selectedIndex } = args;
  const direction = event.key === "ArrowUp" ? "up" : "down";
  if (!sections.length) return { section: 0, item: 0 };
  // next available selection
  let nextSection = selectedIndex.section;
  let nextItem = selectedIndex.item;

  if (direction === "up") {
    nextItem--;
    if (nextItem < 0) {
      // Move to previous section
      nextSection--;
      if (nextSection < 0) {
        // Wrap to last section
        nextSection = sections?.length - 1;
      }
      nextItem = sections?.[nextSection]?.items?.length - 1;
    }
  } else {
    nextItem++;
    if (nextItem >= sections?.[nextSection]?.items?.length) {
      // Move to next section
      nextSection++;
      if (nextSection >= sections?.length) {
        // Wrap to first section
        nextSection = 0;
      }
      nextItem = 0;
    }
  }

  return { section: nextSection, item: nextItem };
};
