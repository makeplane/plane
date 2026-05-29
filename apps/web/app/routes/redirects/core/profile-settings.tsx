import { redirect } from "react-router";
import type { Route } from "./+types/profile-settings";

export const clientLoader = ({ params, request }: Route.ClientLoaderArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const splat = params["*"] || "";
  throw redirect(`/settings/profile/${splat || "general"}?${searchParams.toString()}`);
};

export default function ProfileSettings() {
  return null;
}
