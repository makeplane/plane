import { BarGraph } from "components/ui";
import { convertPayloadToBarGraphData } from "constants/graph";

const Charts = () => {
  const segmentedPayload = {
    "2022-11-16": [
      {
        date: "2022-11-16",
        segment: "Cancelled",
        count: 1,
      },
      {
        date: "2022-11-16",
        segment: "Done",
        count: 10,
      },
    ],
    "2022-11-17": [
      {
        date: "2022-11-17",
        segment: "Backlog",
        count: 1,
      },
      {
        date: "2022-11-17",
        segment: "Bugs",
        count: 1,
      },
      {
        date: "2022-11-17",
        segment: "Cancelled",
        count: 3,
      },
      {
        date: "2022-11-17",
        segment: "Done",
        count: 22,
      },
      {
        date: "2022-11-17",
        segment: "InProgress",
        count: 1,
      },
      {
        date: "2022-11-17",
        segment: "requirement",
        count: 2,
      },
      {
        date: "2022-11-17",
        segment: "Started",
        count: 1,
      },
      {
        date: "2022-11-17",
        segment: "ToDo",
        count: 2,
      },
    ],
    "2022-11-18": [
      {
        date: "2022-11-18",
        segment: "Done",
        count: 7,
      },
    ],
    "2022-11-19": [
      {
        date: "2022-11-19",
        segment: "Done",
        count: 2,
      },
      {
        date: "2022-11-19",
        segment: "ToDo",
        count: 1,
      },
    ],
  };

  const nonSegmentedPayload = {
    "2022-11-16": [
      {
        date: "2022-11-16",
        count: 11,
      },
    ],
    "2022-11-17": [
      {
        date: "2022-11-17",
        count: 33,
      },
    ],
    "2022-11-18": [
      {
        date: "2022-11-18",
        count: 7,
      },
    ],
    "2022-11-19": [
      {
        date: "2022-11-19",
        count: 3,
      },
    ],
    "2022-11-20": [
      {
        date: "2022-11-20",
        count: 6,
      },
    ],
  };

  const data = convertPayloadToBarGraphData(nonSegmentedPayload, false);

  return <BarGraph data={data} indexBy="name" keys={["count"]} />;
};

export default Charts;
