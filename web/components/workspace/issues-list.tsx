import { useRouter } from "next/router";
import Link from "next/link";

// icons
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { truncateText } from "helpers/string.helper";
// types
import { IIssueLite } from "types";
import { Loader } from "@plane/ui";
import { LayerDiagonalIcon } from "components/icons";

type Props = {
  issues: IIssueLite[] | undefined;
  type: "overdue" | "upcoming";
};

export const IssuesList: React.FC<Props> = ({ issues, type }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const getDateDifference = (date: Date) => {
    const today = new Date();

    let diffTime = 0;

    if (type === "overdue") diffTime = Math.abs(today.valueOf() - date.valueOf());
    else diffTime = Math.abs(date.valueOf() - today.valueOf());

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  return (
    <div>
      <h3 className="mb-2 font-semibold capitalize">{type} Issues</h3>
      {issues ? (
        <div className="h-[calc(100%-2.25rem)] rounded-[10px] border border-custom-border-200 bg-custom-background-100 p-4 text-sm">
          <div
            className={`mb-2 grid grid-cols-4 gap-2 rounded-lg px-3 py-2 font-medium ${
              type === "overdue" ? "bg-red-500/20 bg-opacity-20" : "bg-custom-background-80"
            }`}
          >
            <h4 className="capitalize">{type}</h4>
            <h4 className="col-span-2">Issue</h4>
            <h4>{type === "overdue" ? "Due" : "Start"} Date</h4>
          </div>
          <div className="max-h-72 overflow-y-scroll">
            {issues.length > 0 ? (
              issues.map((issue) => {
                const date = type === "overdue" ? issue.target_date : issue.start_date;

                const dateDifference = getDateDifference(new Date(date as string));

                return (
                  <Link href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`} key={issue.id}>
                    <a>
                      <div className="grid grid-cols-4 gap-2 px-3 py-2">
                        <h5
                          className={`flex cursor-default items-center gap-2 ${
                            type === "overdue" ? (dateDifference > 6 ? "text-red-500" : "text-yellow-400") : ""
                          }`}
                        >
                          {type === "overdue" && <ExclamationTriangleIcon className="h-3.5 w-3.5" />}
                          {dateDifference} {dateDifference > 1 ? "days" : "day"}
                        </h5>
                        <h5 className="col-span-2">{truncateText(issue.name, 30)}</h5>
                        <h5 className="cursor-default">
                          {renderShortDateWithYearFormat(new Date(date?.toString() ?? ""))}
                        </h5>
                      </div>
                    </a>
                  </Link>
                );
              })
            ) : (
              <div className="grid h-full place-items-center">
                <div className="my-5 flex flex-col items-center gap-4">
                  <LayerDiagonalIcon height={60} width={60} />
                  <span className="text-custom-text-200">
                    No issues found. Use <pre className="inline rounded bg-custom-background-80 px-2 py-1">C</pre>{" "}
                    shortcut to create a new issue
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Loader>
          <Loader.Item height="200" />
        </Loader>
      )}
    </div>
  );
};
