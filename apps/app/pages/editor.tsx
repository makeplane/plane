import React from "react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("../components/lexical/editor"), {
  ssr: false,
});

const LexicalViewer = dynamic(() => import("../components/lexical/viewer"), {
  ssr: false,
});

const Home = () => {
  const [value, setValue] = React.useState("");
  const onChange: any = (value: any) => {
    console.log(value);
    setValue(value);
  };
  return (
    <>
      <RichTextEditor onChange={onChange} value={value} id="editor" />
      <LexicalViewer id="institution_viewer" value={value} />
    </>
  );
};

export default Home;
