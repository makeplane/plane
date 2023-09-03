// next imports
import Image from "next/image";
import projectNotPublishedImage from "public/project-not-published.svg";

const CustomProjectNotPublishedError = () => (
  <div className="relative w-screen min-h-screen h-full flex justify-center items-center py-5">
    <div className="max-w-[700px] space-y-5">
      <div className="flex items-center flex-col gap-3 text-center">
        <div className="relative w-[240px] h-[240px]">
          <Image src={projectNotPublishedImage} layout="fill" alt="404- Page not found" />
        </div>
        <div className="text-xl font-medium">
          Oops! The page you{`'`}re looking for isn{`'`}t live at the moment.
        </div>
        <div className="text-sm text-custom-text-200">
          If this is your project, login to your workspace to adjust its visibility settings and make it public.
        </div>
      </div>

      <div className="text-center flex justify-center items-center">
        <a
          href={`https://app.plane.so/`}
          className="transition-all border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-800 cursor-pointer p-1.5 px-2.5 rounded-sm text-sm font-medium hover:scale-105 select-none"
        >
          Go to your Workspace
        </a>
      </div>
    </div>
  </div>
);

export default CustomProjectNotPublishedError;
