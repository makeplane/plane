import React from "react";
// next imports
import Image from "next/image";

const features = [
  {
    title: "Plan",
    description:
      "Simple yet powerful planning features make it easy to create and prioritize issues, define milestones and deadlines, and assign tasks to team members.",
    cards: [
      {
        title: (
          <div>
            Create <strong className="font-bold">Issues</strong> in seconds
          </div>
        ),
        description:
          "Create issues, sub-issues with context and detail in seconds. No distraction, no falling through cracks.",
        image: "/images/plan1.png"
      },
      {
        title: (
          <div>
            <strong className="font-bold">View </strong>it as you like
          </div>
        ),
        description:
          "Kanban, or Lists, we’ve got you covered with the Views you want. Please, filters as you like.",
        image: "/images/plan2.png"
      },
      {
        title: (
          <div>
            Match with your <strong className="font-bold">Speed</strong>
          </div>
        ),
        description:
          "Speed up your work with number of Shortcuts, and increase your productivity by 3.3%.",
        image: "/images/plan3.png"
      }
    ]
  },
  {
    title: "Progress",
    description:
      "Create and assign tasks within cycles, track their progress over time, keep your team organized, and ensures that important tasks are completed on time.",
    cards: [
      {
        title: (
          <div>
            Plan better with <strong className="font-bold">Cycles</strong>
          </div>
        ),
        description:
          "Sprint better with Cycles by setting fixed time within projects and delivering faster with precision.",
        image: "/images/progress1.png"
      },
      {
        title: (
          <div>
            Move faster with
            <strong className="font-bold"> Bulk </strong>ops
          </div>
        ),
        description:
          "Organise and move issues better within projects and cycles, with bulk operations and powerful search.",
        image: "/images/progress2.png"
      },
      {
        title: (
          <div>
            Track <strong className="font-bold">and take control</strong>
          </div>
        ),
        description:
          "Track Cycles with Simple stats for your team that’ll help you push and clear your backlogs.",
        image: ""
      }
    ]
  },
  {
    title: "Collaboration",
    description:
      "With its integration capabilities, Plane helps teams stay connected and aligned across different tools and platforms, ensuring that everyone is working towards the same goals.",
    cards: [
      {
        title: (
          <div>
            When in doubt,
            <strong className="font-bold"> Comment </strong>it out
          </div>
        ),
        description:
          "Collaborate and discuss the details of a specific issue within the project using Comments and Activity.",
        image: "/images/colab1.png"
      },
      {
        title: (
          <div>
            Get
            <strong className="font-bold"> Notified</strong> on your Slack
          </div>
        ),
        description:
          "Never miss anything, integrate with your Slack workspace to get notification in real-time.",
        image: "",
        coming_soon: true
      },
      {
        title: (
          <div>
            Work in <strong className="font-bold">Real-time </strong>
          </div>
        ),
        description:
          "[Coming soon] See updates in real-time within your teams across different tabs devices.",
        image: "/images/colab3.png",
        coming_soon: true
      }
    ]
  }
];

const PrimaryFeatures = () => {
  return (
    <div className="bg-[#00091F] py-20">
      <div className="container px-5 mx-auto">
        <div className="text-white">
          {features.map((feature: any, index: number) => (
            <div key={index} className="mt-10 md:mt-20">
              <div className="text-gradient text-2xl">0{index + 1}</div>
              <div className="mt-4 text-3xl">{feature.title}</div>
              <div className="mt-4 mb-10 max-w-2xl font-light">
                {feature.description}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feature.cards.map((card: any, index: number) => (
                  <div
                    key={index}
                    className="card-border-gradient p-[1.5px] rounded-lg h-full flex flex-col relative overflow-hidden"
                  >
                    {card.coming_soon && (
                      <>
                        <div className="absolute text-[8px] button-gradient text-center -rotate-45 w-24 top-4 -left-6">
                          {" "}
                          coming soon
                        </div>
                      </>
                    )}
                    <div className="bg-[#00091F] rounded-lg h-full">
                      <div className="card-gradient rounded-lg h-full flex flex-col p-6">
                        <div className="text-lg font-light">{card.title}</div>
                        <div className="text-[#c0c0c0] mt-3 mb-6">
                          {card.description}
                        </div>
                        <div className="w-full  rounded-lg mt-auto relative">
                          <img
                            src={card.image ? card.image : "/images/plan1.png"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrimaryFeatures;
