"use server";

import { IssuesClientLayout } from "./client-layout";

type Props = {
  children: React.ReactNode;
  params: {
    anchor: string;
  };
};

export async function generateMetadata({ params }: Props) {
  const { anchor } = params;
  const DEFAULT_TITLE = "Plane";
  const DEFAULT_DESCRIPTION = "Made with Plane, an AI-powered work management platform with publishing capabilities.";
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/anchor/${anchor}/meta/`);
    const data = await response.json();
    return { title: data?.name || DEFAULT_TITLE, description: data?.description || DEFAULT_DESCRIPTION };
  } catch {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  }
}

export default async function IssuesLayout(props: Props) {
  const { children, params } = props;
  const { anchor } = params;

  return <IssuesClientLayout anchor={anchor}>{children}</IssuesClientLayout>;
}
