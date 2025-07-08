import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up - Plane",
  robots: {
    index: true,
    follow: false,
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
