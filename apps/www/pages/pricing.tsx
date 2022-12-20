import React from "react";
// next imports
import Link from "next/link";
// layouts
import { DefaultLayout } from "layouts";
// components
import Page from "@components/page";
import Hero from "@components/pricing/Hero";
import CloudPricing from "@components/pricing/Pricing";
import Enterprise from "@components/pricing/Enterprise";
import Community from "@components/pricing/Community";
import Table from "@components/pricing/Table";

// constants
import { META_DESCRIPTION } from "@constants/page";

const HomePage = () => {
  const meta = {
    title: "Plane | Pricing",
    description: META_DESCRIPTION
  };
  const [state, setState] = React.useState("cloud");
  const Tabs = [
    {
      name: "Cloud",
      key: "cloud"
    },

    {
      name: "Self-hosted",
      key: "hosted"
    }
  ];
  return (
    <div>
      <Page meta={meta}>
        <DefaultLayout>
          <div className="h-full overflow-hidden bg-[#00091F]">
            <Hero />
            <div className="mb-2 mt-10 flex w-full space-x-10 justify-center relative">
              {Tabs.map((tab, index) => (
                <div
                  key={`tabs-key-index-${index}`}
                  onClick={() => setState(tab.key)}
                  className={`${
                    state === tab.key ? "text-gradient" : "text-[#8B8B8B]"
                  } cursor-pointer`}
                >
                  <p className="mb-2 px-6 leading-[24px] ">{tab.name}</p>
                  {state === tab.key && (
                    <div className="w-full h-[2px] rounded-full button-gradient mt-3"></div>
                  )}
                </div>
              ))}
            </div>
            {state === "cloud" ? (
              <div className="">
                <CloudPricing />
                <Enterprise />
                {/* <Table/> */}
              </div>
            ) : (
              <div className="">
                <Community />
                {/* <Table/> */}
              </div>
            )}
          </div>
        </DefaultLayout>
      </Page>
    </div>
  );
};

export default HomePage;
