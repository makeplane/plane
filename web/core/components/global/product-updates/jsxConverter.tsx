"use client";
import { useEffect, useRef } from "react";
import type { SerializedInlineBlockNode } from "@payloadcms/richtext-lexical";
import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RichText, JSXConvertersFunction, JSXConverters } from "@payloadcms/richtext-lexical/react";
import { Info, Lightbulb, Megaphone, Search, Zap } from "lucide-react";

type ChangelogCtaFields = {
  title: string;
  icon: "Zap" | "Lens" | "Info" | "Idea" | "Announce" | null;
  color: "Red" | "Yellow" | "Blue" | "Green";
  description: any;
};
type ColoredTextFields = {
  text?: string;
  tag?: string;
  id?: string;
  blockType?: "colored-text";
};

type InlineBlockRendererProps = {
  node: SerializedInlineBlockNode<ColoredTextFields>;
};

type InlineBlockRendererFn = (props: InlineBlockRendererProps) => React.ReactElement | null;

type InlineBlockRendererMap = {
  [key: string]: InlineBlockRendererFn;
};

type InLineBlockConverterType = {
  inlineBlocks: InlineBlockRendererMap;
};

const inLineBlockConverter: InLineBlockConverterType = {
  inlineBlocks: {
    ["colored-text"]: ({ node }) => {
      const text = node.fields.text;

      if (!text) {
        console.warn("Node for 'colored-text' inlineBlock is missing 'text' field:", node);
        return null;
      }

      return <span className="text-blue-500 font-bold font-mono break-all">{text}</span>;
    },
  },
};

const UploadJSXConverter: JSXConverters<any> = {
  upload: ({ node }) => {
    if (node.value?.url) {
      return (
        <img src={node.value.url} alt={node.value.alt || "Uploaded image"} className="w-[100%] h-auto object-cover" />
      );
    }
    return null;
  },
};

const CalloutJSXConverter: any = {
  blocks: {
    Callout: ({ node }: { node: SerializedInlineBlockNode<ChangelogCtaFields> }) => {
      const { fields } = node;

      if (!fields) return null;

      const iconMap = {
        Zap: <Zap />,
        Lens: <Search />,
        Info: <Info />,
        Idea: <Lightbulb />,
        Announce: <Megaphone />,
      };

      const colorClasses = {
        Red: "border border-[#DD4167] dark:border-[#4C182C] dark:bg-[#4C182C]/40  bg-[#DD4167]/40",
        Yellow: "border border-[#D4A72C66] dark:border-[#BF8700] bg-[#FFF8C5] dark:bg-[#332E1B]",
        Blue: "border border-[#3f76ff] dark:border-[#224f6a] bg-[#d9efff] dark:bg-[#1e2934]",
        Green: "border border-[#5CD3B5] dark:border-[#235645] bg-[#D3F9E7] dark:bg-[#1E2B2A]",
      };
      const iconColorClasses = {
        Red: "text-[#DD4167]",
        Yellow: "text-[#9A6700]",
        Blue: "text-[#3f76ff] dark:text-[#4d9ed0]",
        Green: "text-[#208779] dark:text-[#A8F3D0]",
      };

      return (
        <div className="py-4 pb-2 h-full w-full">
          <div className={`p-4 rounded-lg flex flex-row gap-3 ${colorClasses[fields.color] ?? colorClasses.Yellow}`}>
            <div className={`${iconColorClasses[fields.color] ?? iconColorClasses.Yellow}`}>
              {fields.icon && iconMap[fields.icon]}
            </div>
            <div>
              {fields.title && <h4 className="font-semibold mb-1 -mt-0">{fields.title}</h4>}
              {fields.description && (
                <div className="text-sm">
                  <RichText
                    converters={jsxConverters}
                    data={fields.description}
                    className="[&>ul]:list-disc [&>ol]:list-decimal [&_a]:underline"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
    video: ({ node }: { node: any }) => {
      const { fields } = node;
      const { video } = fields;
      return (
        <div className="h-full relative">
          <video controls={false} autoPlay loop muted playsInline>
            <source src={video.url} type={video.mimeType || "video/mp4"} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    },
  },
};

const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...UploadJSXConverter,
  ...CalloutJSXConverter,
  ...inLineBlockConverter,
  // ...videoJSXConverter,
});

export const RichTextNode = ({ description, id }: { description: SerializedEditorState; id: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT, // Only process text nodes
      null // No custom filter function needed
      // false // deprecated argument
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue?.includes("\u00A0")) {
        // \u00A0 is the Unicode char for &nbsp;
        node.nodeValue = node.nodeValue.replace(/\u00A0/g, " "); // Replace all occurrences with a regular space
      }
    }

    const createId = (text: string): string =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9-\s]/g, "")
        .replace(/\s+/g, "-");

    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading) => {
      const text = heading.textContent?.trim() || "";
      const id = createId(text);
      heading.classList.add("text-neutral-text-primary");
      if (!heading.id) {
        heading.id = id;
      }
      const htmlHeading = heading as HTMLElement;
      switch (htmlHeading.tagName) {
        case "H1":
          htmlHeading.style.marginTop = "35px";
          htmlHeading.style.marginBottom = "15px";
          break;
        case "H2":
          htmlHeading.style.marginTop = "35px";
          htmlHeading.style.marginBottom = "20px";
          break;
        case "H3":
          htmlHeading.style.marginTop = "20px";
          htmlHeading.style.marginBottom = "18px";
          break;
      }
    });

    // Fix list styling to ensure bullet points are visible
    const ulElements = container.querySelectorAll("ul");
    ulElements.forEach((ul) => {
      const htmlUl = ul as HTMLElement;
      htmlUl.style.listStyleType = "disc";
      htmlUl.style.listStylePosition = "outside";
      htmlUl.style.paddingLeft = "20px";
      htmlUl.style.marginTop = "10px";
      htmlUl.style.marginBottom = "10px";
    });

    const olElements = container.querySelectorAll("ol");
    olElements.forEach((ol) => {
      const htmlOl = ol as HTMLElement;
      htmlOl.style.listStyleType = "decimal";
      htmlOl.style.listStylePosition = "outside";
      htmlOl.style.paddingLeft = "20px";
      htmlOl.style.marginTop = "10px";
      htmlOl.style.marginBottom = "10px";
    });

    const listItems = container.querySelectorAll("li");
    listItems.forEach((listItem) => {
      const htmlLi = listItem as HTMLElement;
      htmlLi.classList.add("text-custom-text-300");
      htmlLi.style.marginTop = "8px";
      htmlLi.style.marginBottom = "4px";
      htmlLi.style.lineHeight = "1.5";
      htmlLi.style.display = "list-item";
      // Ensure the list item has proper spacing and bullet point visibility
      htmlLi.style.paddingLeft = "4px";
    });

    const paragraphs = container.querySelectorAll("p");
    paragraphs.forEach((paragraph) => {
      paragraph.classList.add("text-neutral-text-primary");
      paragraph.style.fontSize = "16px";
      paragraph.style.marginBottom = "1px";
      paragraph.style.marginTop = "10px";
      paragraph.style.lineHeight = "24px";
      // paragraph.style.overflowWrap = "break-word";
      // paragraph.style.whiteSpace = "break-spaces";
    });

    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      const htmlLink = link as HTMLAnchorElement;
      htmlLink.style.color = "#3191ff";
      htmlLink.style.textDecoration = "underline";
      htmlLink.target = "_blank";
    });

    const strongElements = container.querySelectorAll("strong");
    strongElements.forEach((strongElement) => {
      // strongElement.classList.add("font-mono", "font-bold", "text-blue-500");
      strongElement.classList.add("font-bold", "text-neutral-text-primary");
    });

    const codeElements = container.querySelectorAll("code");
    codeElements.forEach((codeElement) => {
      const htmlCode = codeElement as HTMLElement;
      htmlCode.classList.add("font-mono", "break-all", "font-bold", "text-blue-500");
      htmlCode.style.wordBreak = "break-all";
    });

    const blockquotes = container.querySelectorAll("blockquote");
    blockquotes.forEach((blockquote) => {
      const htmlBlockquote = blockquote as HTMLElement;
      htmlBlockquote.style.padding = "0 16px";
    });
  }, []);

  return (
    <div
      ref={containerRef}
      // style={{letterSpacing: "-0.020em" }}
    >
      <div key={id}>
        <RichText
          data={description}
          className="[&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>ul]:pl-5 [&>ol]:pl-5"
          converters={jsxConverters} // Pass the custom converters here
        />
      </div>
    </div>
  );
};
