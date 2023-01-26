import type { NextPage, NextPageContext } from "next";

// lib
import { homePageRedirect } from "lib/auth";

const Home: NextPage = () => null;

export const getServerSideProps = (ctx: NextPageContext) => {
  const cookies = ctx.req?.headers.cookie;
  return homePageRedirect(cookies);
};

export default Home;
