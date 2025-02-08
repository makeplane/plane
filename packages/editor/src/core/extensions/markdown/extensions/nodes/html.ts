import { getHTMLFromFragment, Node } from "@tiptap/core";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Fragment, Node as NodeType } from "@tiptap/pm/model";
import { elementFromString } from "../../util/dom";

export default Node.create({
  name: "markdownHTMLNode",
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType, parent: NodeType) {
          if (this.editor.storage.markdown.options.html) {
            state.write(serializeHTML(node, parent));
          } else {
            console.warn(`Tiptap Markdown: "${node.type.name}" node is only available in html mode`);
            state.write(`[${node.type.name}]`);
          }
          if (node.isBlock) {
            state.closeBlock(node);
          }
        },
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});

function serializeHTML(node: NodeType, parent: NodeType) {
  const schema = node.type.schema;
  const html = getHTMLFromFragment(Fragment.from(node), schema);

  if (node.isBlock && (parent instanceof Fragment || parent.type.name === schema.topNodeType.name)) {
    return formatBlock(html);
  }

  return html;
}

/**
 * format html block as per the commonmark spec
 */
function formatBlock(html) {
  const dom = elementFromString(html);
  const element = dom.firstElementChild;

  element.innerHTML = element.innerHTML.trim() ? `\n${element.innerHTML}\n` : `\n`;

  return element.outerHTML;
}
