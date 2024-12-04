import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";
import { SelectDropdown } from "./DropdownMenu";
// import { SelectDropdown } from "./DropdownMenu-copy";
const fruits = [
  {
    id: 1,
    name: "Apple",
    emoji: "🍎",
    description:
      "A sweet and crisp fruit, often red or green, great for snacking and baking.",
  },
  {
    id: 2,
    name: "Banana",
    emoji: "🍌",
    description:
      "A long and curved fruit with a soft, creamy flesh, known for its energy-boosting properties.",
  },
  {
    id: 3,
    name: "Cherry",
    emoji: "🍒",
    description:
      "Small, round, and juicy fruits with a sweet or tart flavor, often used in desserts.",
  },
  {
    id: 4,
    name: "Grapes",
    emoji: "🍇",
    description:
      "Small, juicy fruits that grow in clusters, available in various colors like green, red, and purple.",
  },
  {
    id: 5,
    name: "Orange",
    emoji: "🍊",
    description:
      "A citrus fruit known for its tangy and refreshing taste, rich in vitamin C.",
  },
  {
    id: 6,
    name: "Strawberry",
    emoji: "🍓",
    description:
      "A red, heart-shaped fruit with a sweet flavor and tiny seeds on its surface.",
  },
  {
    id: 7,
    name: "Watermelon",
    emoji: "🍉",
    description:
      "A large, juicy fruit with green rind and red flesh, perfect for summertime snacks.",
  },
  {
    id: 8,
    name: "Peach",
    emoji: "🍑",
    description:
      "A soft, fuzzy fruit with a sweet and slightly tangy taste, often enjoyed fresh or in desserts.",
  },
  {
    id: 9,
    name: "Pineapple",
    emoji: "🍍",
    description:
      "A tropical fruit with spiky skin and sweet, tangy yellow flesh.",
  },
  {
    id: 10,
    name: "Lemon",
    emoji: "🍋",
    description:
      "A bright yellow citrus fruit with a tart flavor, commonly used in drinks and cooking.",
  },
];

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/SelectMenuOld",
  component: SelectDropdown,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    items: [1, 2, 3, 4],
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onChange: fn() },
} satisfies Meta<typeof SelectDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    items: fruits,
    value: ["1"],
    keyExtractor: (item) => item.name,
    renderItem: (item) => <Fruit fruit={item} />,
    portal: document.getElementById("portal-root"),
  },
};

// const Hello = () => <div>Hello</div>;

const Fruit = ({ fruit }) => {
  return <div>{`${fruit.emoji} ${fruit.name}`}</div>;
};
