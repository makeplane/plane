// next
import Image from "next/image";
// images
import Module from "public/onboarding/module.png";

const BreakIntoModules: React.FC = () => {
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
          src={Module}
          className="h-full"
          objectFit="contain"
          layout="fill"
          alt="Plane- Modules"
        />
      </div>
      <div className="mx-auto h-1/2 space-y-4 lg:w-1/2">
        <h2 className="text-2xl font-medium">Break into Modules</h2>
        <p className="text-sm text-gray-400">
          Modules break your big think into Projects or Features, to help you organize better.
        </p>
        <p className="text-sm text-gray-400">4/5</p>
      </div>
    </div>
  );
};

export default BreakIntoModules;
