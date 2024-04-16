import { FC } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

type TBanner = {
  type: "success" | "error";
  message: string;
};

export const Banner: FC<TBanner> = (props) => {
  const { type, message } = props;

  return (
    <div className={`rounded-md p-4 w-full ${type === "error" ? "bg-red-50" : "bg-green-50"}`}>
      <div className="flex items-center justify-center">
        <div className="flex-shrink-0">
          {type === "error" ? (
            <span className="flex items-center justify-center h-6 w-6 bg-red-500 rounded-full">
              <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
          ) : (
            <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
          )}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${type === "error" ? "text-red-800" : "text-green-800"} `}>{message}</p>
        </div>
      </div>
    </div>
  );
};
