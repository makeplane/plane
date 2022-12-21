import React from "react";
// next imports
import Link from "next/link";
// layouts
import { DefaultLayout } from "layouts";
// components
import Page from "@components/page";
import Hero from "@components/landing/Hero";
import Features from "@components/landing/Features";
import OpenSource from "@components/landing/OpenSource";
import TimeLine from "@components/landing/TimeLine";
import Community from "@components/landing/Community";
// constants
import { META_DESCRIPTION } from "@constants/page";

const HomePage = () => {
  const meta = {
    title: "Plane | Home",
    description: META_DESCRIPTION
  };

  return (
    <div>
      <Page meta={meta}>
        <DefaultLayout>
          <div className="h-full w-full overflow-hidden">
            <Hero />
            <Features />
            <OpenSource />
            <Community />
          </div>
        </DefaultLayout>
      </Page>
    </div>
  );
};

export default HomePage;
