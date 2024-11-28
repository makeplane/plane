import { Extension } from "@tiptap/core";
import { TypographyOptions, TYPOGRAPHY_RULES, createInputRule } from "./input-rules";

export const CustomTypographyExtension = Extension.create<TypographyOptions>({
  name: "typography",

  addInputRules() {
    return Object.keys(TYPOGRAPHY_RULES)
      .filter((key) => this.options[key] !== false)
      .map((key) => createInputRule(key as keyof typeof TYPOGRAPHY_RULES, this.options[key]))
      .filter((rule): rule is NonNullable<ReturnType<typeof createInputRule>> => rule !== null);
  },
});
