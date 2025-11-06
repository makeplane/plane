import { redirect } from "react-router";
import type { Route } from "./+types/api-tokens";

export const clientLoader = ({ params }: Route.ClientLoaderArgs) => {
  const { workspaceSlug } = params;
  throw redirect(`/${workspaceSlug}/settings/account/api-tokens/`);
};

export default function ApiTokens() {
  return null;
}
