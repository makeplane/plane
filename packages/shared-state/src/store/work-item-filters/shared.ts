// plane imports
import { EIssuesStoreType, TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
// local imports
import { IFilterInstance } from "../rich-filters";

export type TWorkItemFilterKey = `${EIssuesStoreType}-${string}`;

export type IWorkItemFilterInstance = IFilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>;
