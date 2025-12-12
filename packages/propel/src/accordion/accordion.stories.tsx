import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./accordion";

const meta = {
  title: "Components/Accordion",
  component: Accordion.Root,
  parameters: {
    layout: "centered",
    controls: { disable: true },
  },
  tags: ["autodocs"],
  subcomponents: {
    Item: Accordion.Item,
    Trigger: Accordion.Trigger,
    Content: Accordion.Content,
  },
  args: {
    children: null,
  },
} satisfies Meta<typeof Accordion.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <Accordion.Root className="w-96">
        <Accordion.Item value="item-1">
          <Accordion.Trigger>What is Plane?</Accordion.Trigger>
          <Accordion.Content>
            Plane is an open-source project management tool designed for developers and teams to plan, track, and manage
            their work efficiently.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>How do I get started?</Accordion.Trigger>
          <Accordion.Content>
            You can get started by signing up for an account, creating your first workspace, and inviting your team
            members to collaborate.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Is it free to use?</Accordion.Trigger>
          <Accordion.Content>
            Plane offers both free and paid plans. The free plan includes essential features for small teams, while paid
            plans unlock advanced functionality.
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};

export const SingleOpen: Story = {
  render() {
    return (
      <Accordion.Root defaultValue={["item-1"]} className="w-96">
        <Accordion.Item value="item-1">
          <Accordion.Trigger>Section 1</Accordion.Trigger>
          <Accordion.Content>Content for section 1. Only one section can be open at a time.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>Section 2</Accordion.Trigger>
          <Accordion.Content>Content for section 2.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Section 3</Accordion.Trigger>
          <Accordion.Content>Content for section 3.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};

export const AllowMultiple: Story = {
  render() {
    return (
      <Accordion.Root allowMultiple defaultValue={["item-1", "item-2"]} className="w-96">
        <Accordion.Item value="item-1">
          <Accordion.Trigger>First Section</Accordion.Trigger>
          <Accordion.Content>Multiple sections can be open at the same time.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>Second Section</Accordion.Trigger>
          <Accordion.Content>This section is also open by default.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Third Section</Accordion.Trigger>
          <Accordion.Content>You can open this section while keeping the others open.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};

export const WithDisabledItem: Story = {
  render() {
    return (
      <Accordion.Root className="w-96">
        <Accordion.Item value="item-1">
          <Accordion.Trigger>Enabled Section</Accordion.Trigger>
          <Accordion.Content>This section can be toggled.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2" disabled>
          <Accordion.Trigger>Disabled Section</Accordion.Trigger>
          <Accordion.Content>This content cannot be accessed.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Another Enabled Section</Accordion.Trigger>
          <Accordion.Content>This section can also be toggled.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};

export const CustomIcon: Story = {
  render() {
    return (
      <Accordion.Root className="w-96">
        <Accordion.Item value="item-1">
          <Accordion.Trigger
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-data-[panel-open]:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            }
          >
            Custom Chevron Icon
          </Accordion.Trigger>
          <Accordion.Content>
            This accordion uses a custom chevron icon instead of the default plus icon.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-data-[panel-open]:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            }
          >
            Another Section
          </Accordion.Trigger>
          <Accordion.Content>All items in this accordion use the custom icon.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};

export const AsChildTrigger: Story = {
  render() {
    return (
      <Accordion.Root className="w-96">
        <Accordion.Item value="item-1">
          <Accordion.Trigger asChild>
            <button className="w-full rounded-md bg-blue-500 px-4 py-2 text-left text-on-color hover:bg-blue-600">
              Custom Button Trigger
            </button>
          </Accordion.Trigger>
          <Accordion.Content>
            When using asChild, you can completely customize the trigger element without the default icon wrapper.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger asChild>
            <button className="w-full rounded-md bg-green-500 px-4 py-2 text-left text-on-color hover:bg-green-600">
              Another Custom Trigger
            </button>
          </Accordion.Trigger>
          <Accordion.Content>This gives you full control over the trigger styling and behavior.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
};
