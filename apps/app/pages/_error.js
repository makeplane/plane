/**
 * NOTE: This requires `@sentry/nextjs` version 7.3.0 or higher.
 *
 * NOTE: If using this with `next` version 12.2.0 or lower, uncomment the
 * penultimate line in `CustomErrorComponent`.
 *
 * This page is loaded by Nextjs:
 *  - on the server, when data-fetching methods throw or reject
 *  - on the client, when `getInitialProps` throws or rejects
 *  - on the client, when a React lifecycle method throws or rejects, and it's
 *    caught by the built-in Nextjs error boundary
 *
 * See:
 *  - https://nextjs.org/docs/basic-features/data-fetching/overview
 *  - https://nextjs.org/docs/api-reference/data-fetching/get-initial-props
 *  - https://reactjs.org/docs/error-boundaries.html
 */

import * as Sentry from "@sentry/nextjs";
import NextErrorComponent from "next/error";

const CustomErrorComponent = ({ statusCode }) => {
  console.log(statusCode, "statusCode");

  return (
    <p>
      We{"'"}re Sorry! An exception has been detected, and our engineering team has been notified.
      We apologize for any inconvenience this may have caused. Please reach out to our engineering
      team at <a href="mailto:support@plane.so">support@plane.so</a> or on our{" "}
      <a href="https://discord.com/invite/A92xrEGCge" target="_blank" rel="noopener noreferrer">
        Discord
      </a>{" "}
      server for further assistance.
    </p>
  );
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await Sentry.captureUnderscoreErrorException(contextData);

  const { res, err } = contextData;

  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  return { statusCode };
};

export default CustomErrorComponent;
