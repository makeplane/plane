import { redirect } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

export const clientLoader = ({ params }: ClientLoaderFunctionArgs) => {
  const { workspaceSlug } = params;
  throw redirect(`/${workspaceSlug}/settings/account/api-tokens/`);
};

export default function ApiTokens() {
  return null;
}
