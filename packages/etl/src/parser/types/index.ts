import { HTMLElement } from "node-html-parser";
/*
A parser extension has two functions:
  1. shouldParse(root: HTMLElement) -> boolean // Predicate to check whether the extension should parse the html or not
  2. mutate(root: HTMLElement) -> root // Mutate the root node as needed
*/
export interface IParserExtension {
  shouldParse(node: HTMLElement): boolean;
  mutate(node: HTMLElement): Promise<HTMLElement>;
}
