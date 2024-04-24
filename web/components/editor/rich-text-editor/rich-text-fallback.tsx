import React, { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const Fallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      resetErrorBoundary();
    }, 1000);

    return () => clearTimeout(timer);
  }, [resetErrorBoundary]);

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
};

interface ErrorBoundaryWithFallbackProps {
  children: React.ReactNode;
}

const ErrorBoundaryWithFallback: React.FC<ErrorBoundaryWithFallbackProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={(error, errorInfo) => console.log("Error occurred:", error, errorInfo)}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWithFallback;
