// next
import Image from "next/image";
// images
import Commands from "public/onboarding/command-menu.png";

const CommandMenu: React.FC = () => (
    <div className="h-full space-y-4">
      <div className="h-1/2 space-y-4">
        <h5 className="text-sm text-gray-500">Open the contextual menu with:</h5>
        <div className="relative h-1/2">
          <Image src={Commands} objectFit="contain" layout="fill" alt="Plane- Issues" />
        </div>
      </div>
      <div className="mx-auto h-1/2 space-y-4 lg:w-2/3">
        <h2 className="text-2xl font-medium">Command Menu</h2>
        <p className="text-sm text-gray-400">
          With Command Menu, you can create, update and navigate across the platform.
        </p>
        <p className="text-sm text-gray-400">5/5</p>
      </div>
    </div>
  );

export default CommandMenu;
