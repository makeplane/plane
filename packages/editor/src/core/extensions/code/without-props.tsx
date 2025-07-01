import ts from "highlight.js/lib/languages/typescript";
import { common, createLowlight } from "lowlight";
// components
import { CodeBlockLowlight } from "./code-block-lowlight";

const lowlight = createLowlight(common);
lowlight.register("ts", ts);

export const CustomCodeBlockExtensionWithoutProps = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: "plaintext",
  exitOnTripleEnter: false,
});
