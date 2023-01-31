// next
import Image from "next/image";
// images
import Cycle from "public/onboarding/cycle.png";

const MoveWithCycles: React.FC = () => (
    <div className="h-full space-y-4">
      <div className="relative h-1/2">
        <div
          className="absolute bottom-0 z-10 h-8 w-full bg-white"
          style={{
            background: "linear-gradient(0deg, #fff 84.2%, rgba(255, 255, 255, 0) 34.35%)",
          }}
         />
        <Image
          src={Cycle}
          className="h-full"
          objectFit="contain"
          layout="fill"
          alt="Plane- Cycles"
        />
      </div>
      <div className="mx-auto h-1/2 space-y-4 lg:w-2/3">
        <h2 className="text-2xl font-medium">Move with Cycles</h2>
        <p className="text-sm text-gray-400">
          Cycles help you and your team to progress faster, similar to the sprints commonly used in
          agile development.
        </p>
        <p className="text-sm text-gray-400">3/5</p>
      </div>
    </div>
  );

export default MoveWithCycles;
