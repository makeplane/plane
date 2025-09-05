import { ComponentProps, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "./root";

interface StoryProps extends ComponentProps<typeof Calendar> {}

const meta: Meta<StoryProps> = {
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
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const DateRange: Story = {
  render: (args) => {
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
      from: new Date(),
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const Multiple: Story = {
  render: (args) => {
    const [dates, setDates] = useState<Date[]>([
      new Date(),
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    ]);

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="multiple"
          selected={dates}
          onSelect={setDates}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const WithDisabledDates: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Disable weekends
    const disabledDays = [
      { dayOfWeek: [0, 6] }, // Sunday and Saturday
      new Date(2024, 4, 10), // May 10, 2024
    ];

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={disabledDays}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const WeekStartsOnMonday: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          weekStartsOn={1} // Monday
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const WithoutOutsideDays: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          showOutsideDays={false}
          className="rounded-md border"
        />
      </div>
    );
  },
};