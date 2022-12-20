import React from "react";
// next imports
import Image from "next/image";
import Link from "next/link";

const OpenSource = () => {
  const data = [
    { title: "17k+", description: "Stars" },
    { title: "20k+", description: "PRs closed" },
    { title: "300+", description: "Contributors" }
  ];
  return (
    <div className="w-full relative bg-[#00091F]">
      <div className="hidden lg:block">
        <Image
          className="object-fill z-10 "
          layout="fill"
          width="500"
          height="100%"
          src="/background/open-source.svg"
          alt="img"
        />
      </div>
      <div className="relative z-10 py-20 md:py-36 bg-opacity-10">
        <div className="container px-5 mx-auto text-white">
          <div className="w-full lg:w-3/5 ">
            <div className="text-5xl">
              We are <strong>open-source</strong>
            </div>
            <div className="mt-4 max-w-2xl mb-6">
              Host it on your own servers, and easily extend Plane with custom
              integrations. Choose from a rich set of developer APIs and never
              be limited by platform features.
            </div>
            <Link href="https://github.com/makeplane/plane">
              <a className="border text-white  rounded-lg py-2 px-3 mb-4">
                Star us on GitHub
              </a>
            </Link>
            {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.map((item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-lg card-border-gradient p-[1.5px]"
                >
                  <div className="rounded-lg bg-[#00091F]">
                    <div className="card-gradient p-8 rounded-lg">
                      <div className="text-3xl text-center">{item.title}</div>
                      <div className="text-center mt-4 font-light">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenSource;
