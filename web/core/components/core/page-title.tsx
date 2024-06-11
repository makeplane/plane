import Head from "next/head";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export const PageHead: React.FC<PageHeadTitleProps> = (props) => {
  const { title } = props;

  if (!title) return null;

  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
};
