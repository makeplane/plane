import React from "react";
// next imports
import Link from "next/link";
// layouts
import { DefaultLayout } from "layouts";
// components
import Page from "@components/page";
import Hero from "@components/about/Hero";
import Detail from "@components/about/Detail";
import Values from "@components/about/Values"
// constants
import { META_DESCRIPTION } from "@constants/page";

const HomePage = () => {
  const meta = {
    title: "Plane | Work Log",
    description: META_DESCRIPTION
  };

  return (
    <div>
      <Page meta={meta}>
        <DefaultLayout>
          <div className="h-full overflow-hidden bg-[#00091F]">
            <Hero />
            <Detail />
            <Values/>
          </div>
        </DefaultLayout>
      </Page>
    </div>
  );
};

export default HomePage;
