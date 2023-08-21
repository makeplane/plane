// next imports
import Image from "next/image";

const Custom404Error = () => (
  <div className="relative w-screen min-h-screen h-full flex justify-center items-center py-5">
    <div className="max-w-[700px] space-y-5">
      <div className="flex items-center flex-col gap-3 text-center">
        <div className="relative w-[240px] h-[240px]">
          <Image src={`/404.svg`} layout="fill" alt="404- Page not found" />
        </div>
        <div className="text-xl font-medium">Oops! Something went wrong.</div>
        <div className="text-sm text-custom-text-200">
          Sorry, the page you are looking for cannot be found. It may have been removed, had its name changed, or is
          temporarily unavailable.
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

export default Custom404Error;
