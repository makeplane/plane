import Welcome from "public/onboarding/welcome.svg";
import Issue from "public/onboarding/issue.svg";
import Cycle from "public/onboarding/cycle.svg";
import Module from "public/onboarding/module.svg";
import CommandMenu from "public/onboarding/command-menu.svg";

export const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

export const COMPANY_SIZE = [
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
];

export const USER_ROLE = [
  { value: "Founder or leadership team", label: "Founder or leadership team" },
  { value: "Product manager", label: "Product manager" },
  { value: "Designer", label: "Designer" },
  { value: "Software developer", label: "Software developer" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Other", label: "Other" },
];

export const ONBOARDING_CARDS = {
  welcome: {
    imgURL: Welcome,
    step: "1/5",
    title: "Welcome to Plane",
    description: "Plane helps you plan your issues, cycles, and product modules to ship faster.",
  },
  issue: {
    imgURL: Issue,
    step: "2/5",
    title: "Plan with Issues",
    description:
      "The issue is the building block of the Plane. Most concepts in Plane are either associated with issues and their properties.",
  },
  cycle: {
    imgURL: Cycle,
    step: "3/5",
    title: "Move with Cycles",
    description:
      "Cycles help you and your team to progress faster, similar to the sprints commonly used in agile development.",
  },
  module: {
    imgURL: Module,
    step: "4/5",
    title: "Break into Modules ",
    description:
      "Modules break your big think into Projects or Features, to help you organize better.",
  },
  commandMenu: {
    imgURL: CommandMenu,
    step: "5 /5",
    title: "Command Menu",
    description: "With Command Menu, you can create, update and navigate across the platform.",
  },
};
