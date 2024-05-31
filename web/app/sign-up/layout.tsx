import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up - Plane",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <div className={`h-screen w-full overflow-hidden bg-custom-background-100`}>{children}</div>;
}
