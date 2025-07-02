"use client";

import { FC } from "react";
import { observer } from "mobx-react";

// TODO: Implement the WorklogDownloadEmptyScreen component and change the test based on the filters applied
export const WorklogDownloadEmptyScreen: FC = observer(() => (
  <div className="flex justify-center items-center text-sm text-custom-text-300 py-10">No worklog downloads found</div>
));
