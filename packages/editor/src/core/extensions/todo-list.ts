import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
// helpers
import { cn } from "@/helpers/common";

type Props = {
  readOnly?: boolean;
};

export const CustomTodoListExtension = (props?: Props) => {
  const { readOnly } = props;

  return [
    TaskList.configure({
      HTMLAttributes: {
        class: "not-prose pl-2 space-y-2",
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: cn("relative", {
          "pointer-events-none": readOnly,
        }),
      },
      nested: true,
    }),
  ];
};
