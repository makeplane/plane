// next imports
import Image from "next/image";
// next imports
import Link from "next/link";

const content = [
  "Unlimited Issues",
  "Unlimited Members",
  "Unlimited Usage (Entries, API calls, Assets, etc.)",
  "Community support"
];
const Enterprise = () => {
  return (
    <div className="relative w-full overflow-visible my-20 container mx-auto px-5">
      <div className=" card-border-gradient p-[1.5px] rounded-lg">
        <div className="bg-[#00091F] rounded-lg">
          <div className="text-white card-gradient rounded-lg flex flex-wrap divide-y divide-[#2A3144] divide-x">
            <div className="w-full md:w-2/5 h-full">
              <div className="p-10 py-20 flex flex-col">
                <div className="text-center text-[#C0C0C0] text-lg">
                  Community Edition
                </div>
                <div className="text-gradient text-3xl mt-6 text-center font-medium">
                  Free Forever
                </div>
                <div className="text-center font-thin mt-4">
                  Open-Source under Apache 2.0 License
                </div>
                <Link href="#">
                  <a className="button-gradient mx-auto rounded mt-10 px-4 py-1">
                    Self-host Plane
                  </a>
                </Link>
              </div>
            </div>
            <div className="w-full md:w-3/5 h-ful flex flex-col justify-center">
              {content.map((_: string, index: number) => (
                <div
                  key={index}
                  className="flex gap-4 items-center px-10 md:px-20 my-5"
                >
                  <div className="flex-shrink-0 relative w-[24px] h-[24px]">
                    <Image
                      src="/icons/check-circle.svg"
                      className="w-full h-full object-contain rounded"
                      layout="fill"
                      alt="user"
                    />
                  </div>
                  <div className="text-lg font-thin">{_}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enterprise;
