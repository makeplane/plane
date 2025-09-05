import React, { useState, useEffect, useRef } from "react";
import { IframelyResponse } from "@plane/types";
import { cn } from "../utils";
import { EmbedLoading } from "./embed-loading";

type TwitterEmbedProps = {
  iframelyData: IframelyResponse;
};

// User for rendering blockquote components with script in a iframe
export const TwitterEmbed = ({ iframelyData }: TwitterEmbedProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const uniqueId = useRef(`embed-${Math.random().toString(36).substring(2, 9)}`);
  const [iframeHeight, setIframeHeight] = useState<number>(250);
  const [_heightEventsCount, setHeightEventsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.iframeId === uniqueId.current && event.data?.type === "resize" && event.data.height) {
        const newHeight = Math.max(20, event.data.height);
        setIframeHeight((prevHeight) => {
          if (Math.abs(prevHeight - newHeight) > 1) {
            setHeightEventsCount((count) => {
              const newCount = count + 1;
              if (newCount >= 2 && isLoading) {
                setIsLoading(false);
              }
              return newCount;
            });
            return newHeight;
          }
          return prevHeight;
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isLoading]);

  return (
    <div
      className="my-4 bg-transparent"
      style={{
        width: "420px",
        maxWidth: "100%",
        lineHeight: 0,
        position: "relative",
      }}
    >
      {isLoading && <EmbedLoading />}
      <iframe
        ref={iframeRef}
        srcDoc={SRC_DOC_CONTENT(iframelyData, uniqueId.current)}
        title={iframelyData.meta?.title || "Embedded Content"}
        className={cn(
          "w-full border-none rounded-xl overflow-hidden bg-transparent transition-all duration-500",
          isLoading ? "opacity-0 translate-y-2.5" : "animate-fade-in opacity-100"
        )}
        style={{
          height: `${iframeHeight}px`,
          boxShadow: "none",
        }}
      />
    </div>
  );
};

const SRC_DOC_CONTENT = (iframelyData: IframelyResponse, uniqueId: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background-color: transparent !important; /* Explicit transparent background */
            border: none !important; /* No border on body/html */
            overflow: hidden !important; 
            height: auto !important;
            box-sizing: border-box;
          }
          /* Catch-all to remove borders/shadows from any element */
          * {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important; /* Remove potential internal radius causing issues */
          }
          body > div:first-child, 
          body > article:first-child,
          body > section:first-child {
             margin: 0 !important;
             padding: 0 !important;
          }
          .twitter-tweet, 
          blockquote.twitter-tweet {
            margin: 0 !important;
            padding: 0 !important;
          }
          img, video {
             display: block;
             max-width: 100%;
             height: auto;
          }
        </style>
      </head>
      <body>
        ${iframelyData.html}
        <script>
          (function() {
            const iframeId = "${uniqueId}";
            let lastHeight = 0;
            let debounceTimer = null;

            function calculateHeight() {
                return document.body.scrollHeight;
            }

            function requestHeightUpdate() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const currentHeight = calculateHeight();
                    if (Math.abs(currentHeight - lastHeight) > 1) {
                        lastHeight = currentHeight;
                        console.log("[" + iframeId + "] Sending height:", currentHeight);
                        window.parent.postMessage({ type: 'resize', height: currentHeight - 0.2, iframeId: iframeId }, '*');
                    }
                }, 50);
            }

            window.addEventListener('load', requestHeightUpdate);
            document.addEventListener('DOMContentLoaded', requestHeightUpdate);
            window.addEventListener('resize', requestHeightUpdate);

            const observer = new MutationObserver(requestHeightUpdate);
            observer.observe(document.body, {
              attributes: true,
              childList: true,
              subtree: true,
              characterData: true
            });

          })();
        </script>
      </body>
    </html>
  `;
