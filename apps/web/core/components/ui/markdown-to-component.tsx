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

function HeadingPrimary({ children }: { children: React.ReactNode }) {
  return <h1 className="text-16 font-semibold text-primary">{children}</h1>;
}

function HeadingSecondary({ children }: { children: React.ReactNode }) {
  return <h3 className="text-14 font-semibold text-primary">{children}</h3>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-13 text-secondary">{children}</p>;
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return <ol className="mb-4 ml-8 list-decimal text-13 text-secondary">{children}</ol>;
}

function UnorderedList({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 ml-8 list-disc text-13 text-secondary">{children}</ul>;
}

function Link({ href, children }: CustomComponentProps) {
  return (
    <a href={href} className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function MarkdownRenderer({ markdown, options = {} }: Props) {
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
}
