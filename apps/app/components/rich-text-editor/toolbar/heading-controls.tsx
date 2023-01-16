// remirror
import { useCommands, useActive } from "@remirror/react";
// ui
import { CustomMenu } from "ui";

const HeadingControls = () => {
  const { toggleHeading, focus } = useCommands();

  const active = useActive();

  return (
    <div className="flex items-center gap-1">
      <CustomMenu
        width="lg"
        label={`${
          active.heading({ level: 1 })
            ? "Heading 1"
            : active.heading({ level: 2 })
            ? "Heading 2"
            : active.heading({ level: 3 })
            ? "Heading 3"
            : "Normal text"
        }`}
      >
        <CustomMenu.MenuItem
          onClick={() => {
            toggleHeading({ level: 1 });
            focus();
          }}
          className={`${active.heading({ level: 1 }) ? "bg-indigo-50" : ""}`}
        >
          Heading 1
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={() => {
            toggleHeading({ level: 2 });
            focus();
          }}
          className={`${active.heading({ level: 2 }) ? "bg-indigo-50" : ""}`}
        >
          Heading 2
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          onClick={() => {
            toggleHeading({ level: 3 });
            focus();
          }}
          className={`${active.heading({ level: 3 }) ? "bg-indigo-50" : ""}`}
        >
          Heading 3
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  );
};

export default HeadingControls;
