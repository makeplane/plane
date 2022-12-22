import React from "react";

const TimeLine = () => {
  const timelineData = [
    { name: "Private Alpha", description: "Released on October 17, 2022" },
    {
      name: "First open-source commit",
      description: "Scheduled on November 19, 2022"
    },
    { name: "Public beta", description: "Scheduled on December 25, 2022" },
    { name: "Real-time sync", description: "Scheduled on January 14th, 2022" },
    {
      name: "GitHub and Slack integration",
      description: " Scheduled on January 5, 2022"
    }
  ];

  return (
    <div id="roadmap" className="container mx-auto px-5 py-32">
      <h2 className="font-display text-3xl tracking-tight sm:text-4xl md:text-5xl text-center">
        Here's what we are building to keep your itineraries right.{" "}
      </h2>
      <p className="mt-4 text-lg tracking-tight text-gray-400 text-center max-w-lg mx-auto">
        Full roadmap, coming soon.
      </p>
      <ol className=" md:flex space-y-10 md:space-y-0 mt-10">
        {timelineData.map((data: any, index: number) => (
          <li className="relative mb-6 sm:mb-0">
            <div className="flex items-center">
              <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
              <div className="flex flex-shrink-0 z-10 justify-center items-center w-6 h-6 bg-blue-200 rounded-full ring-0 ring-white dark:bg-blue-900 sm:ring-8 dark:ring-gray-900 shrink-0">
                <svg
                  aria-hidden="true"
                  className="w-3 h-3 text-blue-600 dark:text-blue-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </div>
              <div className="hidden sm:flex w-full bg-gray-200 h-0.5 dark:bg-gray-700"></div>
            </div>
            <div className="mt-3 sm:px-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                {data.name}
              </h3>
              <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500 text-center">
                {data.description}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TimeLine;
