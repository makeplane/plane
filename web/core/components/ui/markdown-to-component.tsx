import React from "react";
import ReactMarkdown from "react-markdown";

interface CustomComponentProps {
  href: string;
  children: React.ReactNode;
}

type CustomComponent = React.ComponentType<CustomComponentProps>;

interface Props {
  markdown: string;
  components?: {
    a?: CustomComponent;
    blockquote?: CustomComponent;
    code?: CustomComponent;
    del?: CustomComponent;
    em?: CustomComponent;
    heading?: CustomComponent;
    hr?: CustomComponent;
    image?: CustomComponent;
    inlineCode?: CustomComponent;
    link?: CustomComponent;
    list?: CustomComponent;
    listItem?: CustomComponent;
    paragraph?: CustomComponent;
    strong?: CustomComponent;
    table?: CustomComponent;
    tableCell?: CustomComponent;
    tableHead?: CustomComponent;
    tableRow?: CustomComponent;
  };
  options?: any;
}

const HeadingPrimary: CustomComponent = ({ children }) => (
  <h1 className="text-lg font-semibold text-custom-text-100">{children}</h1>
);

const HeadingSecondary: CustomComponent = ({ children }) => (
  <h3 className="text-base font-semibold text-custom-text-100">{children}</h3>
);

const Paragraph: CustomComponent = ({ children }) => <p className="text-sm text-custom-text-200">{children}</p>;

const OrderedList: CustomComponent = ({ children }) => (
  <ol className="mb-4 ml-8 list-decimal text-sm text-custom-text-200">{children}</ol>
);

const UnorderedList: CustomComponent = ({ children }) => (
  <ul className="mb-4 ml-8 list-disc text-sm text-custom-text-200">{children}</ul>
);

const Link: CustomComponent = ({ href, children }) => (
  <a href={href} className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

export const MarkdownRenderer: React.FC<Props> = ({ markdown, options = {} }) => {
  const customComponents = {
    h1: HeadingPrimary,
    h3: HeadingSecondary,
    p: Paragraph,
    ol: OrderedList,
    ul: UnorderedList,
    a: Link,
  };

  return (
    <ReactMarkdown components={customComponents} {...options}>
      {markdown}
    </ReactMarkdown>
  );
};
