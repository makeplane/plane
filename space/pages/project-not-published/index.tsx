// next imports
import Image from "next/image";
import projectNotPublishedImage from "public/project-not-published.svg";

const CustomProjectNotPublishedError = () => (
  <div className="relative flex h-full min-h-screen w-screen items-center justify-center py-5">
    <div className="max-w-[700px] space-y-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative h-[240px] w-[240px]">
          <Image src={projectNotPublishedImage} layout="fill" alt="404- Page not found" />
        </div>
        <div className="text-xl font-medium">
          Oops! The page you{`'`}re looking for isn{`'`}t live at the moment.
        </div>
        <div className="text-sm text-custom-text-200">
          If this is your project, login to your workspace to adjust its visibility settings and make it public.
        </div>
      </div>

      <div className="flex items-center justify-center text-center">
        <a
          href={`https://app.plane.so/`}
          className="cursor-pointer select-none rounded-sm border border-gray-200 bg-gray-50 p-1.5 px-2.5 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-100 hover:text-gray-800"
        >
          Go to your Workspace
        </a>
      </div>
    </div>
  </div>
);

export default CustomProjectNotPublishedError;
