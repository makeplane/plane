import { BarGraph, PieGraph } from "components/ui";

const Charts = () => {
  // const payload: { name: string; total: number; segments?: any }[] = [
  //   {
  //     name: "Backlog",
  //     total: 5,
  //     segments: {
  //       Bug: 2,
  //       None: 3,
  //     },
  //   },
  //   {
  //     name: "To Do",
  //     total: 3,
  //     segments: {
  //       "Design Issues": 2,
  //       None: 1,
  //     },
  //   },
  //   {
  //     name: "In Progress",
  //     total: 4,
  //     segments: {
  //       Bug: 1,
  //       "Design Issues": 2,
  //       None: 1,
  //     },
  //   },
  //   {
  //     name: "Completed",
  //     total: 0,
  //     segments: {},
  //   },
  //   {
  //     name: "Cancelled",
  //     total: 2,
  //     segments: {
  //       None: 2,
  //     },
  //   },
  // ];

  // const preloadData = {
  //   Bug: 0,
  //   "Design Issues": 0,
  //   None: 0,
  // };

  // const data = payload.map((item) => ({
  //   name: item.name,
  //   total: item.total,
  //   ...preloadData,
  //   ...(item.segments ?? {}),
  // }));

  const data = [
    {
      id: "erlang",
      label: "erlang",
      value: 167,
      color: "hsl(263, 70%, 50%)",
    },
    {
      id: "javascript",
      label: "javascript",
      value: 370,
      color: "hsl(314, 70%, 50%)",
    },
    {
      id: "elixir",
      label: "elixir",
      value: 384,
      color: "hsl(13, 70%, 50%)",
    },
    {
      id: "php",
      label: "php",
      value: 353,
      color: "hsl(106, 70%, 50%)",
    },
    {
      id: "hack",
      label: "hack",
      value: 449,
      color: "hsl(311, 70%, 50%)",
    },
  ];

  return (
    <div className="h-screen">
      {/* <BarGraph data={data} indexBy="name" keys={Object.keys(preloadData)} /> */}
      <PieGraph data={data} innerRadius={0.5} />
    </div>
  );
};

export default Charts;
