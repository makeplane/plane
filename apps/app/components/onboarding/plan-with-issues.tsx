// next
import Image from "next/image";
// images
import Issue from "public/onboarding/issue.png";

const PlanWithIssues: React.FC = () => {
  return (
    <div className="h-full space-y-4">
      <div className="relative h-1/2">
        <div
          className="absolute bottom-0 z-10 h-8 w-full bg-white"
          style={{
            background: "linear-gradient(0deg, #fff 84.2%, rgba(255, 255, 255, 0) 34.35%)",
          }}
        ></div>
        <Image
          src={Issue}
          className="h-full"
          objectFit="contain"
          layout="fill"
          alt="Plane- Issues"
        />
      </div>
      <div className="mx-auto h-1/2 space-y-4 lg:w-2/3">
        <h2 className="text-2xl font-medium">Plan with Issues</h2>
        <p className="text-sm text-gray-400">
          The issue is the building block of the Plane. Most concepts in Plane are either associated
          with issues and their properties.
        </p>
        <p className="text-sm text-gray-400">2/5</p>
      </div>
    </div>
  );
};

export default PlanWithIssues;
