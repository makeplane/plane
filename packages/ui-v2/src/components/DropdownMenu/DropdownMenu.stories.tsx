import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React, { useState } from "react";
import { DropdownMenu } from "./DropdownMenu";
import { DropdownButton } from "./components/DropdownButton";
import { DropdownContent } from "./components/DropdownContent";
import { DropdownItem } from "./components/DropdownItem";
import { fruits } from "../../../data/fruits";
import { vegetables } from "../../../data/vegetables";

// import { SelectDropdown } from "./DropdownMenu-copy";

const fruitsAndVegetables = {
  fruits,
  vegetables,
};
// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/DropdownMenu",
  component: DropdownMenu,
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
  args: {},
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultDropdown = () => {
  return (
    <DropdownMenu defaultOpen={true}>
      <DropdownButton>
        <button>Click me!!</button>
      </DropdownButton>
      <DropdownContent>
        <div>
          <h1>Hello</h1>
          <p>How are you today?</p>
          <DropdownItem onSelect={(e) => console.log(e)}>
            Click me again
          </DropdownItem>
          <DropdownItem onSelect={(e) => e.preventDefault()}>
            Click me, I won't close
          </DropdownItem>
        </div>
      </DropdownContent>
    </DropdownMenu>
  );
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MultiSelect = () => {
  const [value, setValue] = useState([fruits[6]]);
  const [items, setItems] = useState([
    ...fruitsAndVegetables.fruits,
    ...fruitsAndVegetables.vegetables,
  ]);

  const handleSearch = async (query: String) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Filters items on the name
    const filteredItems = fruitsAndVegetables.fruits.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setItems(filteredItems);
  };

  return (
    <DropdownMenu
      items={items}
      onSelect={(e, value) => {
        e.preventDefault();
        console.log(e, value);
      }}
      renderItem={(item) => <Fruit fruit={item} />}
      defaultOpen={true}
      onSearch={handleSearch}
      // isItemDisabled={(item) => item.id % 2 === 0}
    >
      <DropdownButton showIcon>
        <div className="flex items-center gap-2 justify-between">
          <Fruit fruit={fruits[1]} />({value.length})
        </div>
      </DropdownButton>

      {items.length === 0 && (
        <DropdownContent>
          <div>No items found</div>
        </DropdownContent>
      )}
    </DropdownMenu>
  );
};

export const NestedDropdown = () => {
  const items = [
    {
      name: "Vegetables",
      children: fruitsAndVegetables.vegetables,
      emoji: "🥦",
    },
    {
      name: "Fruits",
      children: fruitsAndVegetables.fruits,
      emoji: "🍎",
    },
  ];
  return (
    <div>
      <DropdownMenu
        defaultOpen={true}
        items={items}
        renderItem={(item) => <Fruit fruit={item} />}
      >
        <DropdownButton>
          <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
            Select
          </button>
        </DropdownButton>
      </DropdownMenu>
    </div>
  );
};
const Fruit = ({ fruit }) => {
  return <div>{`${fruit.emoji} ${fruit.name}`}</div>;
};
