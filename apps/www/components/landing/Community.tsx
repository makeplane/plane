import React from "react";
// next imports
import Image from "next/image";
import Link from "next/link";

const Community = () => {
  return (
    <div className="bg-[#00091F] text-white">
      <div className="container mx-auto px-5 py-20 md:py-24 ">
        <h2 className="text-3xl tracking-tight md:text-3xl ">
          Join Our Growing Developer Community
        </h2>
        <div className="max-w-2xl mt-4 text-sm">
          Join our global community of contributors, developers, and enthusiasts
          on Discord and Github. Learn more about Plane through documentation
          from the crew.
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          <Link href="https://twitter.com/planepowers" target="_blank">
            <a className="rounded-lg card-border-gradient p-[1.5px]">
              <div className="rounded-lg bg-[#00091F]">
                <div className="flex flex-col items-center card-gradient py-14 rounded-lg">
                  <div className="relative h-20 w-20">
                    <Image
                      layout="fill"
                      height="40px"
                      width="40px"
                      src="/icons/twitter.svg"
                      alt="Twitter"
                    />
                  </div>
                  <div className="text-gray-400 mt-4">
                    twitter.com
                    <span className="text-[#05C3FF]">/planepowers</span>{" "}
                  </div>
                </div>
              </div>
            </a>
          </Link>
          <Link href="https://github.com/makeplane" target="_blank">
            <a className="rounded-lg card-border-gradient p-[1.5px]">
              <div className="rounded-lg bg-[#00091F]">
                <div className="flex flex-col items-center card-gradient py-14 rounded-lg">
                  <div className="relative h-20 w-20">
                    <Image
                      layout="fill"
                      height="40px"
                      width="40px"
                      src="/icons/github.svg"
                      alt="Twitter"
                    />
                  </div>
                  <div className="text-gray-400 mt-4">
                    github
                    <span className="text-white">/makeplane</span>
                  </div>
                </div>
              </div>
            </a>
          </Link>
          <Link href="https://discord.com/invite/A92xrEGCge" target="_blank">
            <a className="rounded-lg card-border-gradient p-[1.5px]">
              <div className="rounded-lg bg-[#00091F]">
                <div className="flex flex-col items-center card-gradient py-14 rounded-lg">
                  {" "}
                  <div className="relative h-20 w-20">
                    <Image
                      layout="fill"
                      height="40px"
                      width="40px"
                      src="/icons/discord.svg"
                      alt="Twitter"
                    />
                  </div>
                  <div className="mt-4">Join our community</div>
                </div>
              </div>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Community;
