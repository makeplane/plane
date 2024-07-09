"use client";

// components
import { PageDetailsMainContent } from "@/plane-web/components/pages";

type Props = {
  params: {
    anchor: string;
  };
};

export default function PageDetailsPage(props: Props) {
  const { params } = props;
  return <PageDetailsMainContent anchor={params.anchor.toString()} />;
}
