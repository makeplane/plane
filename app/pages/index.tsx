// lib
import { homePageRedirect } from "lib/auth";
// types
import type { NextPage, NextPageContext } from "next";

const Home: NextPage = () => null;

export const getServerSideProps = (ctx: NextPageContext) => {
  const cookies = ctx.req?.headers.cookie;
  return homePageRedirect(cookies);
};

export default Home;
