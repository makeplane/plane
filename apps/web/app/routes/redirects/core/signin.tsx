import { redirect } from "react-router";

export const clientLoader = () => {
  throw redirect("/");
};

export default function Signin() {
  return null;
}
