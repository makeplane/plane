import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";

export class ConfluenceTaskListParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    return (node.tagName === "UL" && node.getAttribute("class")?.includes("inline-task-list")) || false;
  }

  // Convert the task list into checklists
  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const taskList = new HTMLElement("ul", {}, "");
    taskList.setAttribute("data-type", "taskList");

    if (node.tagName === "UL") {
      const children = node.childNodes as HTMLElement[];
      for (const child of children) {
        if (child.tagName === "LI") {
          const isChecked = child.getAttribute("class")?.includes("checked");
          const task = this.createTask(child, isChecked);
          taskList.appendChild(task);
        } else {
          taskList.appendChild(child);
        }
      }
    }

    return taskList;
  }

  createTask(taskItemNode: HTMLElement, isChecked: boolean | undefined): HTMLElement {
    const task = new HTMLElement("li", { class: "flex" }, "");
    task.setAttribute("data-type", "taskItem");
    if (isChecked) {
      task.setAttribute("data-checked", "true");
    }

    const label = new HTMLElement("label", {}, "");
    const checkbox = new HTMLElement("input", {}, "");
    checkbox.setAttribute("type", "checkbox");
    label.appendChild(checkbox);
    task.appendChild(label);
    taskItemNode.childNodes.forEach((child) => task.appendChild(child));
    return task;
  }
}
