import { BarGraph, LineGraph, PieGraph } from "components/ui";

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

  // const data = [
  //   {
  //     id: "erlang",
  //     label: "erlang",
  //     value: 167,
  //     color: "hsl(263, 70%, 50%)",
  //   },
  //   {
  //     id: "javascript",
  //     label: "javascript",
  //     value: 370,
  //     color: "hsl(314, 70%, 50%)",
  //   },
  //   {
  //     id: "elixir",
  //     label: "elixir",
  //     value: 384,
  //     color: "hsl(13, 70%, 50%)",
  //   },
  //   {
  //     id: "php",
  //     label: "php",
  //     value: 353,
  //     color: "hsl(106, 70%, 50%)",
  //   },
  //   {
  //     id: "hack",
  //     label: "hack",
  //     value: 449,
  //     color: "hsl(311, 70%, 50%)",
  //   },
  // ];

  const data = [
    {
      id: "japan",
      color: "hsl(282, 70%, 50%)",
      data: [
        {
          x: "plane",
          y: 89,
        },
        {
          x: "helicopter",
          y: 59,
        },
        {
          x: "boat",
          y: 7,
        },
        {
          x: "train",
          y: 227,
        },
        {
          x: "subway",
          y: 120,
        },
        {
          x: "bus",
          y: 251,
        },
        {
          x: "car",
          y: 233,
        },
        {
          x: "moto",
          y: 92,
        },
        {
          x: "bicycle",
          y: 231,
        },
        {
          x: "horse",
          y: 17,
        },
        {
          x: "skateboard",
          y: 254,
        },
        {
          x: "others",
          y: 174,
        },
      ],
    },
    {
      id: "france",
      color: "hsl(353, 70%, 50%)",
      data: [
        {
          x: "plane",
          y: 199,
        },
        {
          x: "helicopter",
          y: 86,
        },
        {
          x: "boat",
          y: 187,
        },
        {
          x: "train",
          y: 149,
        },
        {
          x: "subway",
          y: 245,
        },
        {
          x: "bus",
          y: 184,
        },
        {
          x: "car",
          y: 254,
        },
        {
          x: "moto",
          y: 269,
        },
        {
          x: "bicycle",
          y: 61,
        },
        {
          x: "horse",
          y: 255,
        },
        {
          x: "skateboard",
          y: 64,
        },
        {
          x: "others",
          y: 92,
        },
      ],
    },
    {
      id: "us",
      color: "hsl(58, 70%, 50%)",
      data: [
        {
          x: "plane",
          y: 87,
        },
        {
          x: "helicopter",
          y: 196,
        },
        {
          x: "boat",
          y: 20,
        },
        {
          x: "train",
          y: 171,
        },
        {
          x: "subway",
          y: 48,
        },
        {
          x: "bus",
          y: 22,
        },
        {
          x: "car",
          y: 229,
        },
        {
          x: "moto",
          y: 209,
        },
        {
          x: "bicycle",
          y: 147,
        },
        {
          x: "horse",
          y: 56,
        },
        {
          x: "skateboard",
          y: 94,
        },
        {
          x: "others",
          y: 246,
        },
      ],
    },
    {
      id: "germany",
      color: "hsl(51, 70%, 50%)",
      data: [
        {
          x: "plane",
          y: 52,
        },
        {
          x: "helicopter",
          y: 199,
        },
        {
          x: "boat",
          y: 84,
        },
        {
          x: "train",
          y: 229,
        },
        {
          x: "subway",
          y: 103,
        },
        {
          x: "bus",
          y: 75,
        },
        {
          x: "car",
          y: 214,
        },
        {
          x: "moto",
          y: 104,
        },
        {
          x: "bicycle",
          y: 298,
        },
        {
          x: "horse",
          y: 86,
        },
        {
          x: "skateboard",
          y: 222,
        },
        {
          x: "others",
          y: 262,
        },
      ],
    },
    {
      id: "norway",
      color: "hsl(217, 70%, 50%)",
      data: [
        {
          x: "plane",
          y: 168,
        },
        {
          x: "helicopter",
          y: 214,
        },
        {
          x: "boat",
          y: 114,
        },
        {
          x: "train",
          y: 287,
        },
        {
          x: "subway",
          y: 100,
        },
        {
          x: "bus",
          y: 93,
        },
        {
          x: "car",
          y: 26,
        },
        {
          x: "moto",
          y: 56,
        },
        {
          x: "bicycle",
          y: 190,
        },
        {
          x: "horse",
          y: 109,
        },
        {
          x: "skateboard",
          y: 274,
        },
        {
          x: "others",
          y: 275,
        },
      ],
    },
  ];

  return (
    <div className="h-screen">
      {/* <BarGraph data={data} indexBy="name" keys={Object.keys(preloadData)} /> */}
      {/* <PieGraph data={data} innerRadius={0.5} /> */}
      <LineGraph data={data} />
    </div>
  );
};

export default Charts;
