import Router from "next/router";
import type { NextPageContext } from "next";

const redirect = (context: NextPageContext, target: any) => {
  if (context.res) {
    // server
    // 303: "See other"
    context.res.writeHead(301, { Location: target });
    context.res.end();
  } else {
    // In the browser, we just pretend like this never even happened ;)
    Router.push(target);
  }
};

export default redirect;
