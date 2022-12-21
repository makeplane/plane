// next imports
import Link from "next/link";
import Image from "next/image";

const DetailsPage = () => {
  const detailsData = [
    {
      image: "/images/demo.png",
      date: "17 December 2022",
      heading: "Lorem ipsum",
      description:
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a. Eget in id vitae pellentesque neque morbi. Eget sed ornare praesent ac cursus. Sit ut massa vitae mauris mauris justo. Odio amet accumsan interdum ultrices mauris pretium eleifend. Nulla elementum morbi volutpat aliquam accumsan diam cum.",
      title: "Fixes & Improvements",
      details: [
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a."
      ]
    },
    {
      image: "/images/demo.png",
      date: "17 December 2022",
      heading: "Lorem ipsum",
      description:
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a. Eget in id vitae pellentesque neque morbi. Eget sed ornare praesent ac cursus. Sit ut massa vitae mauris mauris justo. Odio amet accumsan interdum ultrices mauris pretium eleifend. Nulla elementum morbi volutpat aliquam accumsan diam cum.",
      title: "Fixes & Improvements",
      details: [
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a."
      ]
    },
    {
      image: "/images/demo.png",
      date: "17 December 2022",
      heading: "Lorem ipsum",
      description:
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a. Eget in id vitae pellentesque neque morbi. Eget sed ornare praesent ac cursus. Sit ut massa vitae mauris mauris justo. Odio amet accumsan interdum ultrices mauris pretium eleifend. Nulla elementum morbi volutpat aliquam accumsan diam cum.",
      title: "Fixes & Improvements",
      details: [
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a.",
        "Lorem ipsum dolor sit amet consectetur. Id proin enim molestie in quis porttitor lorem orci. Iaculis faucibus morbi tristique eu odio maecenas sagittis a."
      ]
    }
  ];
  return (
    <div className="bg-[#00091F] relative w-full overflow-visible text-white pt-20">
      <div className="container mx-auto px-5">
        {detailsData.map((detail: any, index: number) => (
          <div key={index} className="my-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
              <div className="relative h-96 w-full">
                <Image
                  className="object-contain z-0"
                  layout="fill"
                  src="/images/demo.png"
                  alt="img features"
                />
              </div>
              <div className="mt-auto">
                <div className="font-thin text-lg">{detail.date}</div>
                <div className="text-3xl font-medium my-5">
                  {detail.heading}
                </div>
                <div className="text-sm font-thinok">{detail.description}</div>
              </div>
            </div>
            <div className="mt-10 ml-4 text-xl">{detail.title}</div>
            {detail.details.map((_: any, index: number) => (
              <div className="flex gap-4 my-4">
                <div className="relative h-5 w-5 mt-2 flex-shrink-0">
                  <Image
                    layout="fill"
                    height="40px"
                    width="40px"
                    src="/icons/bullet.svg"
                    alt="Twitter"
                  />
                </div>
                <div className="text-lg">{_}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailsPage;
