"use client";

// ui
import { Button } from "@plane/ui";

const ErrorPage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="grid h-screen place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Exception Detected!</h3>
          <p className="mx-auto w-1/2 text-sm text-custom-text-200">
            We{"'"}re Sorry! An exception has been detected, and our engineering team has been notified. We apologize
            for any inconvenience this may have caused. Please reach out to our engineering team at{" "}
            <a href="mailto:support@plane.so" className="text-custom-primary">
              support@plane.so
            </a>{" "}
            or on our{" "}
            <a
              href="https://discord.com/invite/A92xrEGCge"
              target="_blank"
              className="text-custom-primary"
              rel="noopener noreferrer"
            >
              Discord
            </a>{" "}
            server for further assistance.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="primary" size="md" onClick={handleRetry}>
            Refresh
          </Button>
          {/* <Button variant="neutral-primary" size="md" onClick={() => {}}>
            Sign out
          </Button> */}
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
