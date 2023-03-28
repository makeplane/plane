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

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? ObjectType[Key] extends { pop: any; push: any }
      ? `${Key}`
      : `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];
