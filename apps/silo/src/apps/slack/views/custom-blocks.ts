import {
  InputBlock,
  StaticSelect,
  PlainTextInput,
  MultiExternalSelect,
  Checkboxes,
  ExternalSelect,
  RichTextInput,
} from "@slack/types";

export interface StaticSelectInputBlock extends InputBlock {
  element: StaticSelect;
}

export interface PlainTextInputBlock extends InputBlock {
  element: PlainTextInput;
}

export interface MultiExternalSelectInputBlock extends InputBlock {
  element: MultiExternalSelect;
}

export interface CheckboxInputBlock extends InputBlock {
  element: Checkboxes;
}

export interface ExternalSelectInputBlock extends InputBlock {
  element: ExternalSelect;
}

export interface RichTextInputBlock extends InputBlock {
  element: RichTextInput;
}
