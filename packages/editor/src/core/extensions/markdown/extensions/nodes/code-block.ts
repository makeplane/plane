import { Node } from "@tiptap/core";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as NodeType } from "@tiptap/pm/model";

const CodeBlock = Node.create({
  name: "codeBlock",
});

export default CodeBlock.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType) {
          state.write("```" + (node.attrs.language || "") + "\n");
          state.text(node.textContent, false);
          state.ensureNewLine();
          state.write("```");
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit) {
            markdownit.set({
              langPrefix: this.options.languageClassPrefix ?? "language-",
            });
          },
          updateDOM(element: Element) {
            element.innerHTML = element.innerHTML.replace(/\n<\/code><\/pre>/g, "</code></pre>");
          },
        },
      },
    };
  },
});
