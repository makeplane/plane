// next imports
import Image from "next/image";

const CloudPricing = () => {
  const pricingData = [
    {
      title: "Cloud Free",
      description: "Free Forever",
      details: [
        "Unlimited Members",
        "1000 issues",
        "5MB per issue file uploads",
        "Community Support"
      ],
      button: "Get started with Free"
    },
    {
      title: "Cloud Pro",
      description: "$5 per user / month",
      details: [
        "Everything in free, plus",
        "Unlimited issues",
        "Unlimited file uploads",
        "Priority Support"
      ],
      button: "Get started with Cloud Pro"
    }
  ];

  return (
    <div className="bg-[#00091F] mt-20 relative">
      <div className="container mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-6 text-white">
        {pricingData.map((data: any, index: number) => (
          <div
            key={index}
            className="card-border-gradient p-[1.5px] rounded-lg"
          >
            <div className="bg-[#00091F] rounded-lg">
              <div className="card-gradient rounded-lg">
                <div className="p-8">
                  <div className="text-center text-[#C0C0C0]">{data.title}</div>
                  <div className="text-3xl text-center mt-4 whitespace-nowrap">
                    {data.description}
                  </div>
                </div>
                <div className="border-t-[1px] border-[#2A3144] w-full"></div>
                <div className="p-4">
                  {data.details.map((_: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-4 items-center px-20 my-5"
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
                <div className="p-8">
                  <button className="w-full button-gradient py-3 rounded-lg">
                    {data.button}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CloudPricing;
