import { PlaneUser } from "@plane/sdk";

export type EmailUser =
  | {
      emailAddress?: string;
    }
  | string;

export const compareAndGetAdditionalUsers = (planeMembers: PlaneUser[], sourceMembers: EmailUser[]) => {
  // Create a Set of plane member emails for O(1) lookup
  const planeMemberEmails = new Set(planeMembers.map((member) => member.email));
  // Filter source members in a single pass
  return sourceMembers
    .map((member) => (typeof member === "string" ? member : member.emailAddress))
    .filter((email): email is string => email !== undefined && !planeMemberEmails.has(email));
};
