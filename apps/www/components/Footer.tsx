import React from "react";
// next import
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <>
      <div className="button-gradient pt-[1.5px]">
        <div className="bg-[#00091F] text-white">
          <div className="container mx-auto px-5 py-20 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-8">
              <div className="mb-5 flex flex-col">
                <div className="text-4xl font-medium tracking-wide leading-relaxed text-center lg:text-left">
                  Questions? Comments? <br className="hidden lg:block" />
                  Concerns?
                </div>
                <div className="mx-auto lg:ml-0 button-gradient bg-black w-min whitespace-nowrap px-6 py-2  mt-5 rounded-lg">
                  <Link
                    href="https://discord.com/invite/8SR2N9PAcJ"
                    target="_blank"
                  >
                    <a>Chat to us on Discord</a>
                  </Link>
                </div>
              </div>
              <div className="">
                <div className="grid grid-cols-3 divide-x text-center text-[#C0C0C0] max-h-min">
                  <Link href="mailto:hello@plane.so">
                    <a className="">CONTACT</a>
                  </Link>
                  <Link href="/privacy-policy">
                    <a className="">PRIVACY POLICY</a>
                  </Link>
                  <Link href="/terms-and-conditions">
                    <a className="">TERMS & CONDITIONS</a>
                  </Link>
                </div>
                <div className="flex w-full mt-8 justify-center lg:justify-end items-center gap-6">
                  <Link href="https://twitter.com/planepowers">
                    <a className="flex-shrink-0 relative w-[40px] h-[40px]">
                      <Image
                        src="/icons/twitter-white.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </a>
                  </Link>
                  <Link href="https://discord.com/invite/A92xrEGCge">
                    <a className="flex-shrink-0 relative w-[40px] h-[40px]">
                      <Image
                        src="/icons/discord-white.svg"
                        className="w-full h-full object-contain rounded"
                        layout="fill"
                        alt="user"
                      />
                    </a>
                  </Link>
                </div>
                <div className="flex justify-center lg:justify-end mt-10">
                  <div className="flex-shrink-0 relative w-28 h-8">
                    <Image
                      src="/logo/plane-wordmark.svg"
                      className="w-full h-full object-contain rounded"
                      layout="fill"
                      alt="user"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Footer;
