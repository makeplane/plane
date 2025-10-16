import { Outlet } from "react-router";
import type { Route } from "./+types/layout";

// export const metadata: Metadata = {
//   title: "Sign up - Plane",
//   robots: {
//     index: true,
//     follow: false,
//   },
// };

export default function SignUpLayout() {
  return <Outlet />;
}

export const meta: Route.MetaFunction = () => [{ title: "Sign up - Plane" }];
