// helper
import { renderDateFormat } from "helpers/date-time.helper";

export const DUE_DATES = [
  {
    name: "Last week",
    value: [
      `${renderDateFormat(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000))};after`,
      `${renderDateFormat(new Date())};before`,
    ],
  },
  {
    name: "2 weeks from now",
    value: [
      `${renderDateFormat(new Date())};after`,
      `${renderDateFormat(new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000))};before`,
    ],
  },
  {
    name: "1 month from now",
    value: [
      `${renderDateFormat(new Date())};after`,
      `${renderDateFormat(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
      )};before`,
    ],
  },
  {
    name: "2 months from now",
    value: [
      `${renderDateFormat(new Date())};after`,
      `${renderDateFormat(
        new Date(new Date().getFullYear(), new Date().getMonth() + 2, new Date().getDate())
      )};before`,
    ],
  },
];
