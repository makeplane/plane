import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./index";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    mode: {
      control: "select",
      options: ["primary", "transparent", "true-transparent"],
    },
    inputSize: {
      control: "select",
      options: ["xs", "sm", "md"],
    },
    hasError: {
      control: "boolean",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
    },
    autoComplete: {
      control: "select",
      options: ["on", "off"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

const createStory = (args: Partial<React.ComponentProps<typeof Input>>): Story => ({
  args: { placeholder: "Enter text...", className: "w-[400px]", ...args },
});

const createShowcaseStory = (
  title: string,
  sections: Array<{ label: string; props: Partial<React.ComponentProps<typeof Input>> }>
): Story => ({
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <h3 className="text-13 font-medium">{title}</h3>
        <div className="space-y-2">
          {sections.map(({ label, props }, index) => (
            <div key={index} className="w-full">
              <label className="text-11 text-gray-500">{label}</label>
              <Input className="w-full" {...props} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
});

export const Default = createStory({});

export const Primary = createStory({
  mode: "primary",
  placeholder: "Primary input",
});

export const Transparent = createStory({
  mode: "transparent",
  placeholder: "Transparent input",
});

export const TrueTransparent = createStory({
  mode: "true-transparent",
  placeholder: "True transparent input",
});

export const ExtraSmall = createStory({
  inputSize: "xs",
  placeholder: "Extra small input",
});

export const Small = createStory({
  inputSize: "sm",
  placeholder: "Small input",
});

export const Medium = createStory({
  inputSize: "md",
  placeholder: "Medium input",
});

export const WithError = createStory({
  hasError: true,
  placeholder: "Input with error",
  defaultValue: "Invalid input",
});

export const Disabled = createStory({
  disabled: true,
  placeholder: "Disabled input",
  defaultValue: "Cannot edit this",
});

export const WithValue = createStory({
  defaultValue: "Pre-filled value",
  placeholder: "Input with value",
});

export const Email = createStory({
  type: "email",
  placeholder: "Enter your email",
  autoComplete: "on",
});

export const Password = createStory({
  type: "password",
  placeholder: "Enter your password",
  autoComplete: "off",
});

export const Number = createStory({
  type: "number",
  placeholder: "Enter a number",
});

export const Search = createStory({
  type: "search",
  placeholder: "Search...",
});

export const AllModes = createShowcaseStory("Input Modes", [
  { label: "Primary", props: { mode: "primary", placeholder: "Primary input" } },
  { label: "Transparent", props: { mode: "transparent", placeholder: "Transparent input" } },
  { label: "True Transparent", props: { mode: "true-transparent", placeholder: "True transparent input" } },
]);

export const AllSizes = createShowcaseStory("Input Sizes", [
  { label: "Extra Small (xs)", props: { inputSize: "xs", placeholder: "Extra small input" } },
  { label: "Small (sm)", props: { inputSize: "sm", placeholder: "Small input" } },
  { label: "Medium (md)", props: { inputSize: "md", placeholder: "Medium input" } },
]);

export const AllStates = createShowcaseStory("Input States", [
  { label: "Normal", props: { placeholder: "Normal input" } },
  { label: "With Error", props: { hasError: true, placeholder: "Input with error" } },
  { label: "Disabled", props: { disabled: true, placeholder: "Disabled input" } },
  { label: "With Value", props: { defaultValue: "Pre-filled value", placeholder: "Input with value" } },
]);
