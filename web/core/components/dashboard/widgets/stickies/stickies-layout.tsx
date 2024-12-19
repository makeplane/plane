import React, { cloneElement, useState, useEffect } from "react";

interface TileContent {
  title: string;
  description: string;
}

export const TILES: TileContent[] = [
  {
    title: "Product Roadmap",
    description:
      "Q1 2024 product strategy and milestones. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments.This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments.",
  },
  {
    title: "Design System",
    description: "Component library and design tokens documentation with guidelines for implementation.",
  },
  {
    title: "User Research",
    description:
      "Customer interviews and feedback analysis for new features. Includes synthesis of user testing sessions and recommendations for product improvements.",
  },
  {
    title: "Sprint Planning",
    description: "Next sprint goals and task allocation with detailed breakdown of upcoming work items.",
  },
  {
    title: "Team Updates",
    description: "Weekly progress updates and current blockers affecting development timeline.",
  },
  {
    title: "Release Notes",
    description:
      "Latest features and bug fixes documentation with detailed changelog and migration guides for developers.",
  },
  {
    title: "Performance Metrics",
    description:
      "Key performance indicators and system metrics tracking. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments.",
  },
  {
    title: "Documentation",
    description: "Technical documentation and API references for the development team.",
  },
  {
    title: "Product Roadmap",
    description:
      "Q1 2024 product strategy and milestones. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments.This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments.",
  },
  {
    title: "Design System",
    description: "Component library and design tokens documentation with guidelines for implementation.",
  },
  {
    title: "User Research",
    description:
      "Customer interviews and feedback analysis for new features. Includes synthesis of user testing sessions and recommendations for product improvements.",
  },
  {
    title: "Sprint Planning",
    description: "Next sprint goals and task allocation with detailed breakdown of upcoming work items.",
  },
  {
    title: "Team Updates",
    description: "Weekly progress updates and current blockers affecting development timeline.",
  },
  {
    title: "Release Notes",
    description:
      "Latest features and bug fixes documentation with detailed changelog and migration guides for developers. Component library and design tokens documentation with guidelines for implementation. Component library and design tokens documentation with guidelines for implementation. Component library and design tokens documentation with guidelines for implementation.",
  },
  {
    title: "Performance Metrics",
    description:
      "Key performance indicators and system metrics tracking. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments. This includes detailed planning for feature releases and team coordination across multiple departments.",
  },
  {
    title: "Documentation",
    description: "Technical documentation and API references for the development team.",
  },
];

interface GridProps {
  children: React.ReactNode;
  columnCount: number;
}

const Grid: React.FC<GridProps> = ({ children, columnCount }) => {
  const cols = [...Array(columnCount).keys()];
  const rows = [...Array(Math.ceil(React.Children.count(children) / columnCount)).keys()];

  return (
    <div className="flex flex-row w-full gap-4">
      {cols.map((col: number, index: number) => (
        <div key={index} className="flex flex-col w-full gap-4">
          {rows.map((row: number) => {
            const child = React.Children.toArray(children)[row * columnCount + col];
            return child && cloneElement(child as React.ReactElement);
          })}
        </div>
      ))}
    </div>
  );
};

export const StickiesLayout = () => {
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    const updateColumnCount = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setColumnCount(4); // lg screens
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setColumnCount(3); // md screens
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setColumnCount(2); // sm screens
      } else {
        setColumnCount(1); // mobile
      }
    };

    // Initial check
    updateColumnCount();

    // Add event listener for window resize
    window.addEventListener("resize", updateColumnCount);

    // Cleanup
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  return (
    <div>
      <Grid columnCount={columnCount}>
        {TILES.map((content: TileContent, index) => (
          <div key={index} className="w-full p-4 rounded-lg bg-custom-background-90 cursor-pointer">
            <h3 className="text-lg font-semibold text-custom-text-100 mb-2">
              {index} {content.title}
            </h3>
            <p className="text-sm text-custom-text-200">{content.description}</p>
          </div>
        ))}
      </Grid>
    </div>
  );
};
