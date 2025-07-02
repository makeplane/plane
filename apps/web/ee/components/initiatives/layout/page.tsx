"use client";

import { observer } from "mobx-react";
// local components
import { InitiativesRoot } from "../components/initiatives-root";
import { InitiativeAppliedFiltersRoot } from "../header/filters";

export const InitiativesPageRoot = observer(() => (
  <div className="h-full w-full flex flex-col">
    <InitiativeAppliedFiltersRoot />
    <InitiativesRoot />
  </div>
));
