"use client";

import useSWR from "swr";
// hooks
import { useStates } from "@/hooks/store";
// components
import { PageDetailsMainContent } from "@/plane-web/components/pages";

type Props = {
  params: {
    anchor: string;
  };
};

export default function PageDetailsPage(props: Props) {
  const { params } = props;
  // params
  const { anchor } = params;
  // store
  const { fetchStates } = useStates();

  useSWR(anchor ? `PUBLIC_STATES_${anchor}` : null, anchor ? () => fetchStates(anchor) : null);

  return <PageDetailsMainContent anchor={params.anchor.toString()} />;
}
