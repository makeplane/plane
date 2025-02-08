import { Node } from "@tiptap/core";
import taskListPlugin from "markdown-it-task-lists";
import BulletList from "./bullet-list";

const TaskList = Node.create({
  name: "taskList",
});

export default TaskList.extend({
  addStorage() {
    return {
      markdown: {
        serialize: BulletList.storage.markdown.serialize,
        parse: {
          setup(markdownit) {
            markdownit.use(taskListPlugin);
          },
          updateDOM(element) {
            [...element.querySelectorAll(".contains-task-list")].forEach((list) => {
              list.setAttribute("data-type", "taskList");
            });
          },
        },
      },
    };
  },
});
