import { redirect } from "react-router";

export const clientLoader = () => {
  throw redirect(`/settings/profile/api-tokens/`);
};

export default function ApiTokens() {
  return null;
}
