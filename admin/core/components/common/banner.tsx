import { FC } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type TBanner = {
  type: "success" | "error";
  message: string;
};

export const Banner: FC<TBanner> = (props) => {
  const { type, message } = props;

  return (
    <div
      className={`rounded-md p-2 w-full border ${type === "error" ? "bg-red-500/5 border-red-400" : "bg-green-500/5 border-green-400"}`}
    >
      <div className="flex items-center justify-center">
        <div className="flex-shrink-0">
          {type === "error" ? (
            <span className="flex items-center justify-center h-6 w-6 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </span>
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
          )}
        </div>
        <div className="ml-1">
          <p className={`text-sm font-medium ${type === "error" ? "text-red-600" : "text-green-600"}`}>{message}</p>
        </div>
      </div>
    </div>
  );
};
