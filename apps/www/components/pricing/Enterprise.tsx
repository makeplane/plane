// next imports
import Image from "next/image";
// next imports
import Link from "next/link";

const content = [
  "Unlimited everything",
  "Custom billing",
  "Talk to us",
  "SAML / Single Sign On",
  "Audit log and app management",
  "Priority support"
];
const Enterprise = () => {
  return (
    <div className="relative w-full overflow-visible my-20 container mx-auto px-5">
      <div className=" card-border-gradient p-[1.5px] rounded-lg">
        <div className="bg-[#00091F] rounded-lg">
          <div className="text-white card-gradient rounded-lg flex flex-wrap items-center divide-y divide-[#2A3144] divide-x">
            <div className="w-full md:w-2/5 h-full">
              <div className="p-10 py-20 flex flex-col">
                <div className="text-center text-[#C0C0C0] text-lg">
                  Enterprise
                </div>
                <div className="text-gradient text-3xl mt-6 text-center font-medium">
                  Coming Soon
                </div>
                <Link href="#">
                  <a className="button-gradient mx-auto rounded mt-4 px-4 py-1">
                    Talk to us
                  </a>
                </Link>
                {/* <div className="text-center font-thin mt-10">
                  Lorem ipsum dolor sit amet consectetur. Luctus amet tortor
                  facilisis pellentesque. Sit feugiat faucibus luctus tempor et
                  enim. Sit amet metus viverra congue quis a sagittis ut
                  lacinia.
                </div> */}
              </div>
            </div>
            <div className="w-full md:w-3/5 h-ful py-10">
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
