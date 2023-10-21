export * from "./users";
export * from "./workspace";
export * from "./cycles";
export * from "./projects";
export * from "./state";
export * from "./invitation";
export * from "./issues";
export * from "./modules";
export * from "./views";
export * from "./integration";
export * from "./pages";
export * from "./ai";
export * from "./estimate";
export * from "./importer";
export * from "./inbox";
export * from "./analytics";
export * from "./calendar";
export * from "./notifications";
export * from "./waitlist";
export * from "./reaction";
export * from "./view-props";
export * from "./workspace-views";

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? ObjectType[Key] extends { pop: any; push: any }
      ? `${Key}`
      : `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];
