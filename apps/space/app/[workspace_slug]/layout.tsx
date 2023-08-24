// next imports
import { Metadata } from "next";

type LayoutProps = {
  params: { workspace_slug: string };
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  // read route params
  const { workspace_slug } = params;

  return {
    title: `${workspace_slug} | Plane`,
    description: `${workspace_slug} | Plane`,
    icons: `/plane-logo.webp`,
  };
}

const Layout = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default Layout;
