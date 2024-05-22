import { Metadata } from "next";
// components
import { InstanceSignInForm } from "@/components/login";
// layouts
import { DefaultLayout } from "@/layouts/default-layout";

export const metadata: Metadata = {
  title: "Plane | Simple, extensible, open-source project management tool.",
  description:
    "Open-source project management tool to manage issues, sprints, and product roadmaps with peace of mind.",
  openGraph: {
    title: "Plane | Simple, extensible, open-source project management tool.",
    description:
      "Open-source project management tool to manage issues, sprints, and product roadmaps with peace of mind.",
    url: "https://plane.so/",
  },
  keywords:
    "software development, customer feedback, software, accelerate, code management, release management, project management, issue tracking, agile, scrum, kanban, collaboration",
  twitter: {
    site: "@planepowers",
  },
};

export default async function LoginPage() {
  return (
    <DefaultLayout>
      <InstanceSignInForm />
    </DefaultLayout>
  );
}
