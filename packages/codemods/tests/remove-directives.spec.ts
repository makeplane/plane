import { describe, it, expect } from "vitest";
import { applyTransform } from "@hypermod/utils";
import * as transformer from "../remove-directives";

describe("remove-directives", () => {
  it("should remove 'use client' directive", async () => {
    const result = await applyTransform(
      transformer,
      `
      "use client";
      import React from "react";

      export const MyComponent = () => {
        return <div>Hello, world!</div>;
      };
      `,
      { parser: "tsx" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            export const MyComponent = () => {
              return <div>Hello, world!</div>;
            };"
    `);
  });

  it("should remove 'use server' directive", async () => {
    const result = await applyTransform(
      transformer,
      `
      "use server";
      import db from "./db";

      export const getData = async () => {
        return db.query("SELECT * FROM users");
      };
      `,
      { parser: "ts" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import db from "./db";

            export const getData = async () => {
              return db.query("SELECT * FROM users");
            };"
    `);
  });

  it("should remove 'use client' directive with single quotes", async () => {
    const result = await applyTransform(
      transformer,
      `
      'use client';
      import React from "react";

      export const MyComponent = () => {
        return <div>Hello, world!</div>;
      };
      `,
      { parser: "tsx" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            export const MyComponent = () => {
              return <div>Hello, world!</div>;
            };"
    `);
  });

  it("should remove multiple directives", async () => {
      const result = await applyTransform(
        transformer,
        `
        "use client";
        "use strict";
        import React from "react";

        export const MyComponent = () => {
          return <div>Hello, world!</div>;
        };
        `,
        { parser: "tsx" },
      );

      expect(result).toMatchInlineSnapshot(`
        ""use strict";;
                import React from "react";

                export const MyComponent = () => {
                  return <div>Hello, world!</div>;
                };"
      `);
    });

  it("should ignore directives inside functions", async () => {
    const result = await applyTransform(
      transformer,
      `
      import React from "react";

      export const MyComponent = () => {
        "use client";
        return <div>Hello, world!</div>;
      };
      `,
      { parser: "tsx" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            export const MyComponent = () => {
              "use client";
              return <div>Hello, world!</div>;
            };"
    `);
  });
  
  it("should preserve comments", async () => {
     const result = await applyTransform(
      transformer,
      `
      // comment before
      "use client";
      // comment after
      import React from "react";
      `,
      { parser: "tsx" }
     );
     
     expect(result).toMatchInlineSnapshot(`
       "// comment before
             // comment after
             import React from "react";"
     `);
  });

  it("should remove 'use-client' directive with hyphen", async () => {
    const result = await applyTransform(
      transformer,
      `
      "use-client";
      import type { FC } from "react";
      // types
      import type { TDeDupeIssue } from "@plane/types";

      type TDuplicateModalRootProps = {
        workspaceSlug: string;
        issues: TDeDupeIssue[];
        handleDuplicateIssueModal: (value: boolean) => void;
      };

      export function DuplicateModalRoot(props: TDuplicateModalRootProps) {
        const { workspaceSlug, issues, handleDuplicateIssueModal } = props;
        return <></>;
      }
      `,
      { parser: "tsx" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import type { FC } from "react";
            // types
            import type { TDeDupeIssue } from "@plane/types";

            type TDuplicateModalRootProps = {
              workspaceSlug: string;
              issues: TDeDupeIssue[];
              handleDuplicateIssueModal: (value: boolean) => void;
            };

            export function DuplicateModalRoot(props: TDuplicateModalRootProps) {
              const { workspaceSlug, issues, handleDuplicateIssueModal } = props;
              return <></>;
            }"
    `);
  });

  it("should remove 'use-client' directive with hyphen and single quotes", async () => {
    const result = await applyTransform(
      transformer,
      `
      'use-client';
      import type { FC } from "react";
      import { useState } from "react";
      // plane imports
      import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

      export function MyComponent() {
        return <div>Hello</div>;
      }
      `,
      { parser: "tsx" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import type { FC } from "react";
            import { useState } from "react";
            // plane imports
            import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

            export function MyComponent() {
              return <div>Hello</div>;
            }"
    `);
  });

  it("should remove 'use-server' directive with hyphen", async () => {
    const result = await applyTransform(
      transformer,
      `
      "use-server";
      import db from "./db";

      export const getData = async () => {
        return db.query("SELECT * FROM users");
      };
      `,
      { parser: "ts" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import db from "./db";

            export const getData = async () => {
              return db.query("SELECT * FROM users");
            };"
    `);
  });

  it("should handle 'use-client' in modal component structure", async () => {
    const result = await applyTransform(
      transformer,
      `
      "use-client";

      import type { FC } from "react";
      import { useState } from "react";
      // plane imports
      import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
      // hooks
      import useKeypress from "@/hooks/use-keypress";
      // local imports
      import { InboxIssueCreateRoot } from "./create-root";

      type TInboxIssueCreateModalRoot = {
        workspaceSlug: string;
        projectId: string;
        modalState: boolean;
        handleModalClose: () => void;
      };

      export function InboxIssueCreateModalRoot(props: TInboxIssueCreateModalRoot) {
        const { workspaceSlug, projectId, modalState, handleModalClose } = props;
        return <></>;
      }
      `,
      { parser: "tsx" },
    );

    expect(result).toMatchInlineSnapshot(`
      "import type { FC } from "react";
            import { useState } from "react";
            // plane imports
            import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
            // hooks
            import useKeypress from "@/hooks/use-keypress";
            // local imports
            import { InboxIssueCreateRoot } from "./create-root";

            type TInboxIssueCreateModalRoot = {
              workspaceSlug: string;
              projectId: string;
              modalState: boolean;
              handleModalClose: () => void;
            };

            export function InboxIssueCreateModalRoot(props: TInboxIssueCreateModalRoot) {
              const { workspaceSlug, projectId, modalState, handleModalClose } = props;
              return <></>;
            }"
    `);
  });
});

