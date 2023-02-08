import { useState, useEffect, FC } from "react";
// remirror imports
import { cx } from "@remirror/core";
import { useMentionAtom, MentionAtomNodeAttributes, FloatingWrapper } from "@remirror/react";

// export const;

export interface IMentionAutoComplete {
  mentions?: any[];
  tags?: any[];
}

export const MentionAutoComplete: FC<IMentionAutoComplete> = (props) => {
  const { mentions = [], tags = [] } = props;
  // states
  const [options, setOptions] = useState<MentionAtomNodeAttributes[]>([]);

  const { state, getMenuProps, getItemProps, indexIsHovered, indexIsSelected } = useMentionAtom({
    items: options,
  });

  useEffect(() => {
    if (!state) {
      return;
    }
    const searchTerm = state.query.full.toLowerCase();
    let filteredOptions: MentionAtomNodeAttributes[] = [];

    if (state.name === "tag") {
      filteredOptions = tags.filter((tag) => tag?.label.toLowerCase().includes(searchTerm));
    } else if (state.name === "at") {
      filteredOptions = mentions.filter((user) => user?.label.toLowerCase().includes(searchTerm));
    }

    filteredOptions = filteredOptions.sort().slice(0, 5);
    setOptions(filteredOptions);
  }, [state, mentions, tags]);

  const enabled = Boolean(state);
  return (
    <FloatingWrapper positioner="cursor" enabled={enabled} placement="bottom-start">
      <div {...getMenuProps()} className="suggestions">
        {enabled &&
          options.map((user, index) => {
            const isHighlighted = indexIsSelected(index);
            const isHovered = indexIsHovered(index);

            return (
              <div
                key={user.id}
                className={cx("suggestion", isHighlighted && "highlighted", isHovered && "hovered")}
                {...getItemProps({
                  item: user,
                  index,
                })}
              >
                {user.label}
              </div>
            );
          })}
      </div>
    </FloatingWrapper>
  );
};
