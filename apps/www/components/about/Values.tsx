// next imports
import Image from "next/image";

const Values = () => {
  const valueData = [
    {
      title: "Accessibility",
      description:
        "We believe powerful tools for planning and tracking work should be accessible to teams of all sizes and budgets."
    },
    {
      title: "Openness",
      description:
        "As an open-source project, we are committed to transparency and collaboration and making our code available for anyone to use and contribute to."
    },
    {
      title: "Flexibility",
      description:
        "Every team is unique, so we aim to provide a tool that can be customized and tailored to the specific needs of each team."
    },
    {
      title: "Collaboration",
      description:
        "We believe that collaboration is key to success, so we aim to provide features that make it easy for teams to communicate and work together."
    },
    {
      title: "User friendliness",
      description:
        "As an open-source project, we are committed to transparency and collaboration and making our code available for anyone to use and contribute to."
    },
    {
      title: "Continual improvement",
      description:
        "We are committed to constantly improving Plane, based on feedback from our users and the broader community."
    }
  ];
  return (
    <div className="bg-[#00091F] my-20 relative">
      <div className="container mx-auto px-5 gap-6 text-white">
        <div className="text-4xl my-10">Our Values</div>
        <div className="grid grid-cols-3 gap-4 gap-y-6">
          {valueData.map((data: any, index: number) => (
            <div
              key={index}
              className="card-border-gradient p-[1.5px] rounded-lg"
            >
              <div className="bg-[#00091F] rounded-lg h-full">
                <div className="bg-card-border rounded-lg p-6">
                  <div className="text-center text-xl">{data.title}</div>
                  <div className="mt-5 font-light">{data.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Values;
