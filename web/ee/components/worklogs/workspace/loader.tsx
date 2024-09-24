"use client";

import { FC } from "react";
import { Loader } from "@plane/ui";
// plane web constants
import { EWorklogLoader } from "@/plane-web/constants/workspace-worklog";

type TWorklogLoader = { loader: EWorklogLoader };

export const WorklogLoader: FC<TWorklogLoader> = (props) => {
  const { loader } = props;

  return (
    <Loader>
      {/* filter */}
      {loader === EWorklogLoader.WORKSPACE_INIT_LOADER && (
        <div className="flex justify-between items-center h-full gap-5 border-b border-custom-border-200 pb-3">
          <div className="flex items-center gap-2">
            <Loader.Item height="20px" width="70px" />
            <Loader.Item height="20px" width="70px" />
            <Loader.Item height="20px" width="140px" />
          </div>
          <Loader.Item height="28px" width="100px" />
        </div>
      )}

      {/* table */}
      <div>
        <table className="table-auto border-b border-custom-border-200 w-full overflow-hidden whitespace-nowrap">
          <thead className="border-b border-custom-border-200">
            <tr>
              <th className="p-2.5">
                <Loader.Item height="18.9px" width="70px" />
              </th>
              <th className="p-2.5">
                <Loader.Item height="18.9px" width="60px" />
              </th>
              <th className="p-2.5">
                <Loader.Item height="18.9px" width="80px" />
              </th>
              <th className="p-2.5">
                <Loader.Item height="18.9px" width="50px" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={index}>
                <td className="p-2.5">
                  <Loader.Item height="18.9px" width="40%" />
                </td>
                <td className="p-2.5">
                  <Loader.Item height="18.9px" width="80%" />
                </td>
                <td className="p-2.5">
                  <Loader.Item height="18.9px" width="80%" />
                </td>
                <td className="p-2.5">
                  <Loader.Item height="18.9px" width="40%" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {loader === EWorklogLoader.WORKSPACE_INIT_LOADER && (
        <div className="flex justify-between items-center gap-2 py-4">
          <Loader.Item height="20px" width="70px" />
          <div className="flex items-center gap-2">
            <Loader.Item height="28px" width="70px" />
            <Loader.Item height="28px" width="70px" />
          </div>
        </div>
      )}
    </Loader>
  );
};
