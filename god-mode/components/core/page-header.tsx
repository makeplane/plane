import Head from "next/head";

type TPageHeader = {
  title?: string;
  description?: string;
};

export const PageHeader: React.FC<TPageHeader> = (props) => {
  const { title = "God Mode - Plane", description = "Plane god mode" } = props;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
    </Head>
  );
};
