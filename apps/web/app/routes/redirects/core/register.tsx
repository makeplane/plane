import { redirect } from "react-router";

export const clientLoader = () => {
  throw redirect("/sign-up/");
};

export default function Register() {
  return null;
}
