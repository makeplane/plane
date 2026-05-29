import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./root";

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  args: {
    showOutsideDays: true,
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleDate: Story = {
  render(args) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4">
        <Calendar {...args} mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
      </div>
    );
  },
};

export const MultipleDates: Story = {
  render(args) {
    const [dates, setDates] = useState<Date[] | undefined>([
      new Date(2024, 0, 15),
      new Date(2024, 0, 20),
      new Date(2024, 0, 25),
    ]);

    return (
      <div className="p-4">
        <Calendar {...args} mode="multiple" selected={dates} onSelect={setDates} className="rounded-md border" />
      </div>
    );
  },
};

export const RangeSelection: Story = {
  render(args) {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(2024, 0, 10),
      to: new Date(2024, 0, 20),
    });

    return (
      <div className="p-4">
        <Calendar {...args} mode="range" selected={range} onSelect={setRange} className="rounded-md border" />
      </div>
    );
  },
};

export const DisabledDates: Story = {
  render(args) {
    const [date, setDate] = useState<Date | undefined>();
    const disabledDays = [new Date(2024, 0, 5), new Date(2024, 0, 12), new Date(2024, 0, 19), new Date(2024, 0, 26)];

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

export const DisabledWeekends: Story = {
  render(args) {
    const [date, setDate] = useState<Date | undefined>();

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const MinMaxDates: Story = {
  render(args) {
    const [date, setDate] = useState<Date | undefined>();
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    const tenDaysFromNow = new Date(today);
    tenDaysFromNow.setDate(today.getDate() + 10);

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(date) => date < tenDaysAgo || date > tenDaysFromNow}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const WeekStartsOnMonday: Story = {
  render(args) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="single"
          selected={date}
          onSelect={setDate}
          weekStartsOn={1}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const WithoutOutsideDays: Story = {
  render(args) {
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

export const TwoMonths: Story = {
  render(args) {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(2024, 0, 10),
      to: new Date(2024, 1, 15),
    });

    return (
      <div className="p-4">
        <Calendar
          {...args}
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          className="rounded-md border"
        />
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  render() {
    return (
      <div className="p-4">
        <Calendar mode="single" defaultMonth={new Date(2024, 0)} showOutsideDays className="rounded-md border" />
      </div>
    );
  },
};
