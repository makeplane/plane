import { ComponentProps, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "./root";

type CalendarProps = ComponentProps<typeof Calendar>;

const meta: Meta<CalendarProps> = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  args: {
    showOutsideDays: true,
  },
};

export default meta;
type Story = StoryObj<CalendarProps>;

export const Default: Story = {
  args: {},
  render: (args: CalendarProps) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4">
        <Calendar {...args} mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
      </div>
    );
  },
};
