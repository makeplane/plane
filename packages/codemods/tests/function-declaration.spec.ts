import { describe, it, expect } from "vitest";
import { applyTransform } from "@hypermod/utils";
import * as transformer from "../function-declaration";

describe("function-declaration", () => {
  it("should convert arrow function components to function declarations", async () => {
    const result = await applyTransform(
      transformer,
      `
      import React from "react";

      export const MyComponent: React.FC<{}> = () => {
        return <div>Hello, world!</div>;
      };
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            export function MyComponent() {
              return <div>Hello, world!</div>;
            }"
    `);
  });

  it("should handle components with props", async () => {
    const result = await applyTransform(
      transformer,
      `
      import React from "react";

      interface IMyComponentProps {
        name: string;
      }

      export const MyComponent: React.FC<IMyComponentProps> = ({ name }) => {
        return <div>Hello, {name}!</div>;
      };
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            interface IMyComponentProps {
              name: string;
            }

            export function MyComponent(
              {
                name
              }: IMyComponentProps
            ) {
              return <div>Hello, {name}!</div>;
            }"
    `);
  });

  it("should preserve default props", async () => {
    const result = await applyTransform(
      transformer,
      `
      import React from "react";

      interface IMyComponentProps {
        name?: string;
      }

      export const MyComponent: React.FC<IMyComponentProps> = ({ name = "world" }) => {
        return <div>Hello, {name}!</div>;
      };
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            interface IMyComponentProps {
              name?: string;
            }

            export function MyComponent(
              {
                name = "world"
              }: IMyComponentProps
            ) {
              return <div>Hello, {name}!</div>;
            }"
    `);
  });

  it("should not transform non-component arrow functions", async () => {
    const result = await applyTransform(
      transformer,
      `
      const myFunction = () => {
        return "hello";
      };
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "const myFunction = () => {
              return "hello";
            };"
    `);
  });

  it("should handle observer-wrapped components", async () => {
    const result = await applyTransform(
      transformer,
      `
      import { observer } from "mobx-react";

      export const WorkspaceAnalyticsHeader = observer(() => {
        return <div>Analytics</div>;
      });
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import { observer } from "mobx-react";

            export const WorkspaceAnalyticsHeader = observer(function WorkspaceAnalyticsHeader() {
              return <div>Analytics</div>;
            });"
    `);
  });

  it("should handle inline arrow function components", async () => {
    const result = await applyTransform(
      transformer,
      `
      export const StarUsOnGitHubLink = () => {
        return <a href="https://github.com">Star us</a>;
      };
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "export function StarUsOnGitHubLink() {
              return <a href="https://github.com">Star us</a>;
            }"
    `);
  });

  it("should handle React.FC type without generics", async () => {
    const result = await applyTransform(
      transformer,
      `
      import type { FC } from "react";

      export const ProjectAppSidebar: FC = observer(() => {
        return <div>Sidebar</div>;
      });
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import type { FC } from "react";

            export const ProjectAppSidebar = observer(function ProjectAppSidebar() {
              return <div>Sidebar</div>;
            });"
    `);
  });

  it("should handle inline JSX arrow function", async () => {
    const result = await applyTransform(
      transformer,
      `
      export const DateAlert = (props: TDateAlertProps) => <></>;
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "export function DateAlert(props: TDateAlertProps) {
                  return <></>;
            }"
    `);
  });

  it("should handle observer with generic type parameters", async () => {
    const result = await applyTransform(
      transformer,
      `
      import { observer } from "mobx-react";

      export const InstanceProvider = observer<React.FC<React.PropsWithChildren>>((props) => {
        const { children } = props;
        return <>{children}</>;
      });
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import { observer } from "mobx-react";

            export const InstanceProvider = observer(function InstanceProvider(props: React.PropsWithChildren) {
              const { children } = props;
              return <>{children}</>;
            });"
    `);
  });

  it("should not add double semicolons after use client directive", async () => {
    const result = await applyTransform(
      transformer,
      `
      "use client";
      import { observer } from "mobx-react";

      export const MyComponent = observer(() => {
        return <div>Hello</div>;
      });
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      ""use client";
            import { observer } from "mobx-react";

            export const MyComponent = observer(function MyComponent() {
              return <div>Hello</div>;
            });"
    `);
  });

  it("should preserve generic type parameters in wrapper functions", async () => {
    const result = await applyTransform(
      transformer,
      `
      import React from "react";

      export const ScatterChart = React.memo(<K extends string, T extends string>(props: TScatterChartProps<K, T>) => {
        return <div>Chart</div>;
      });
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            export const ScatterChart = React.memo(
              function ScatterChart<K extends string, T extends string>(props: TScatterChartProps<K, T>) {
                return <div>Chart</div>;
              }
            );"
    `);
  });

  it("should preserve generic type parameters on React.forwardRef", async () => {
    const result = await applyTransform(
      transformer,
      `
      import React from "react";

      const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
        return <button ref={ref}>Click me</button>;
      });
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import React from "react";

            const Button = React.forwardRef(
              function Button(props: ButtonProps, ref: React.ForwardedRef<HTMLButtonElement>) {
                return <button ref={ref}>Click me</button>;
              }
            );"
    `);
  });

  it("should prefix unused props parameter with underscore", async () => {
    const result = await applyTransform(
      transformer,
      `
      import type { TCallbackMentionComponentProps } from "@plane/editor";

      export const EditorAdditionalMentionsRoot: React.FC<TCallbackMentionComponentProps> = () => null;
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import type { TCallbackMentionComponentProps } from "@plane/editor";

            export function EditorAdditionalMentionsRoot(_props: TCallbackMentionComponentProps) {
                  return null;
            }"
    `);
  });

  it("should add Record<string, unknown> type for React.forwardRef with only element type", async () => {
    const result = await applyTransform(
      transformer,
      `
      import { forwardRef } from "react";

      const ListLoaderItemRow = forwardRef<HTMLDivElement>((props, ref) => (
        <div ref={ref}>Content</div>
      ));
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";

            const ListLoaderItemRow = forwardRef(
              function ListLoaderItemRow(props: Record<string, unknown>, ref: React.ForwardedRef<HTMLDivElement>) {
                return (<div ref={ref}>Content</div>);
              }
            );"
    `);
  });

  it("should preserve comments in function body", async () => {
    const result = await applyTransform(
      transformer,
      `
      export const PreloadResources = () => (
        // usePreloadResources();
        null
      );
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "export function PreloadResources() {
              return (
                // usePreloadResources();
                (null)
              );
            }"
    `);
  });

  it("should preserve leading comments before export declaration", async () => {
    const result = await applyTransform(
      transformer,
      `
"use client";

// TODO: Check if we need this
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#link-relpreload
// export const usePreloadResources = () => {
//   useEffect(() => {
//     const preloadItem = (url: string) => {
//       ReactDOM.preload(url, { as: "fetch", crossOrigin: "use-credentials" });
//     };
//
//     const urls = [
//       \`\${process.env.VITE_API_BASE_URL}/api/instances/\`,
//       \`\${process.env.VITE_API_BASE_URL}/api/users/me/\`,
//       \`\${process.env.VITE_API_BASE_URL}/api/users/me/profile/\`,
//       \`\${process.env.VITE_API_BASE_URL}/api/users/me/settings/\`,
//       \`\${process.env.VITE_API_BASE_URL}/api/users/me/workspaces/?v=\${Date.now()}\`,
//     ];
//
//     urls.forEach((url) => preloadItem(url));
//   }, []);
// };

export const PreloadResources = () =>
  // usePreloadResources();
  null;
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      ""use client";

      // TODO: Check if we need this
      // https://nextjs.org/docs/app/api-reference/functions/generate-metadata#link-relpreload
      // export const usePreloadResources = () => {
      //   useEffect(() => {
      //     const preloadItem = (url: string) => {
      //       ReactDOM.preload(url, { as: "fetch", crossOrigin: "use-credentials" });
      //     };
      //
      //     const urls = [
      //       \`\${process.env.VITE_API_BASE_URL}/api/instances/\`,
      //       \`\${process.env.VITE_API_BASE_URL}/api/users/me/\`,
      //       \`\${process.env.VITE_API_BASE_URL}/api/users/me/profile/\`,
      //       \`\${process.env.VITE_API_BASE_URL}/api/users/me/settings/\`,
      //       \`\${process.env.VITE_API_BASE_URL}/api/users/me/workspaces/?v=\${Date.now()}\`,
      //     ];
      //
      //     urls.forEach((url) => preloadItem(url));
      //   }, []);
      // };

      export function PreloadResources() {
        return (
          // usePreloadResources();
          null
        );
      }"
    `);
  });

  it("should preserve leading comments before wrapped export declaration", async () => {
    const result = await applyTransform(
      transformer,
      `
// This is a wrapped component
// It uses observer for reactivity
export const MyObserverComponent = observer(() => {
  return <div>Observer component</div>;
});
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "// This is a wrapped component
      // It uses observer for reactivity
      export const MyObserverComponent = observer(function MyObserverComponent() {
        return <div>Observer component</div>;
      });"
    `);
  });

  it("should preserve trailing comments on exported variable declaration", async () => {
    const result = await applyTransform(
      transformer,
      `
      export const Foo = () => <div />; // trailing comment
      `,
      { parser: "tsx" }
    );

    expect(result).toContain("// trailing comment");
  });

  it("should preserve leading comments on exported variable declaration inside export", async () => {
    const result = await applyTransform(
      transformer,
      `
      export /* leading comment */ const Foo = () => <div />;
      `,
      { parser: "tsx" }
    );

    expect(result).toContain("/* leading comment */");
  });

  it("should preserve dependency arrays when transforming wrapped components", async () => {
    const result = await applyTransform(
      transformer,
      `
      import { useMemo } from "react";

      const MyComponent = useMemo(() => {
        return () => <div>Hello</div>;
      }, [dep]);
      `,
      { parser: "tsx", path: "file.tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import { useMemo } from "react";

            const MyComponent = useMemo(function MyComponent() {
              return () => <div>Hello</div>;
            }, [dep]);"
    `);
  });

  it("should preserve dependency arrays for constants that look like components", async () => {
    const result = await applyTransform(
      transformer,
      `
      import { useMemo } from "react";

      const ACTION_HANDLERS = useMemo(function ACTION_HANDLERS() {
        return {
          archived: () => {},
        };
      }, []);
      `,
      { parser: "tsx", path: "file.tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import { useMemo } from "react";

            const ACTION_HANDLERS = useMemo(function ACTION_HANDLERS() {
              return {
                archived: () => {},
              };
            }, []);"
    `);
  });

  it("should handle memo with generic type arguments correctly", async () => {
    const result = await applyTransform(
      transformer,
      `
      import { memo } from "react";

      type TAccessMenuProps = {
        currentAccess: number;
      };

      export const AccessMenu = memo<TAccessMenuProps>(
        ({ currentAccess }) => {
          return <div>{currentAccess}</div>;
        }
      );
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "import { memo } from "react";

            type TAccessMenuProps = {
              currentAccess: number;
            };

            export const AccessMenu = memo(function AccessMenu(
              {
                currentAccess
              }: TAccessMenuProps
            ) {
              return <div>{currentAccess}</div>;
            });"
    `);
  });

  it("should not transform CONSTANT_CASE variables", async () => {
    const result = await applyTransform(
      transformer,
      `
      export const MY_CONSTANT = () => {
        return "value";
      };
      `,
      { parser: "tsx" }
    );

    expect(result).toMatchInlineSnapshot(`
      "export const MY_CONSTANT = () => {
              return "value";
            };"
    `);
  });
});
