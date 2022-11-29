import React, { useState } from "react";

const assignees = [
  {
    name: "Wade Cooper",
    value: "wade-cooper",
  },
  { name: "Unassigned", value: "null" },
];

import { SearchListbox } from "ui";

const Page = () => {
  const [assigned, setAssigned] = useState(assignees[0]);

  return (
    <div className="flex justify-center items-center h-screen w-full">
      <SearchListbox
        display="Assign"
        name="assignee"
        options={assignees}
        onChange={(value) => {
          setAssigned(assignees.find((assignee) => assignee.value === value) ?? assignees[0]);
        }}
        value={assigned.value}
      />
    </div>
  );
};

export default Page;
