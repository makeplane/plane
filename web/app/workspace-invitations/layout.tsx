import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Invitations",
};

export default function WorkspaceInvitationsLayout({ children }: { children: React.ReactNode }) {
  return <div className={`h-screen w-full overflow-hidden bg-custom-background-100`}>{children}</div>;
}
