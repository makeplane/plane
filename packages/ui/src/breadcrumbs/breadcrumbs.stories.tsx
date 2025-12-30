import type { Meta, StoryObj } from "@storybook/react";
import { Home, Settings, Briefcase, GridIcon, Layers2, FileIcon } from "lucide-react";
import * as React from "react";
import { ContrastIcon, EpicIcon, LayersIcon } from "@plane/propel/icons";
import { Breadcrumbs } from "./breadcrumbs";
import { BreadcrumbNavigationDropdown } from "./navigation-dropdown";

const meta: Meta<typeof Breadcrumbs> = {
  title: "UI/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
};

type TBreadcrumbBlockProps = {
  href?: string;
  label?: string;
  icon?: React.ReactNode;
  disableTooltip?: boolean;
};

// TODO: remove this component and use web Link component
function BreadcrumbBlock(props: TBreadcrumbBlockProps) {
  const { label, icon, disableTooltip = false } = props;

  return (
    <>
      <Breadcrumbs.ItemWrapper label={label} disableTooltip={disableTooltip}>
        {icon && <div className="flex size-4 items-center justify-center overflow-hidden !text-16">{icon}</div>}
        {label && <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>}
      </Breadcrumbs.ItemWrapper>
    </>
  );
}

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    children: [
      <Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />,
      <Breadcrumbs.Item key="projects" component={<BreadcrumbBlock href="/projects" label="Projects" />} />,
      <Breadcrumbs.Item
        key="current"
        component={<BreadcrumbBlock href="/projects/current" label="Current Project" />}
      />,
    ],
  },
};

export const WithLoading: Story = {
  args: {
    isLoading: true,
    children: [
      <Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />,
      <Breadcrumbs.Item key="projects" component={<BreadcrumbBlock href="/projects" label="Projects" />} />,
    ],
  },
};

export const WithCustomComponent: Story = {
  args: {
    children: [
      <Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />,
      <Breadcrumbs.Item
        key="custom"
        component={
          <div className="flex items-center gap-2">
            <span className="size-4 rounded-full bg-blue-500" />
            <span>Custom Component</span>
          </div>
        }
      />,
    ],
  },
};

export const SingleItem: Story = {
  args: {
    children: [<Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />],
  },
};

export const WithNavigationDropdown: Story = {
  args: {
    children: [
      <Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />,
      <Breadcrumbs.Item
        key="projects"
        component={
          <BreadcrumbNavigationDropdown
            selectedItemKey="project-1"
            navigationItems={[
              {
                key: "project-1",
                title: "Project Alpha",

                action: () => console.log("Project Alpha selected"),
              },
              {
                key: "project-2",
                title: "Project Beta",

                action: () => console.log("Project Beta selected"),
              },
              {
                key: "project-3",
                title: "Project Gamma",

                action: () => console.log("Project Gamma selected"),
              },
            ]}
          />
        }
        showSeparator={false}
      />,
      <Breadcrumbs.Item key="settings" component={<BreadcrumbBlock href="/settings" label="Settings" />} />,
    ],
  },
};

export const WithNavigationDropdownAndIcons: Story = {
  args: {
    children: [
      <Breadcrumbs.Item
        key="home"
        component={<BreadcrumbBlock href="/" label="Home" icon={<Home className="size-3.5" />} />}
      />,
      <Breadcrumbs.Item
        key="projects"
        component={
          <BreadcrumbNavigationDropdown
            selectedItemKey="project-1"
            navigationItems={[
              {
                key: "project-1",
                title: "Project Alpha",
                icon: Briefcase,

                action: () => console.log("Project Alpha selected"),
              },
              {
                key: "project-2",
                title: "Project Beta",
                icon: Briefcase,

                // disabled: true,
                action: () => console.log("Project Beta selected"),
              },
              {
                key: "project-3",
                title: "Project Gamma",
                icon: Briefcase,

                action: () => console.log("Project Gamma selected"),
              },
            ]}
          />
        }
        showSeparator={false}
      />,
      <Breadcrumbs.Item
        key="features"
        component={
          <BreadcrumbNavigationDropdown
            selectedItemKey="feature-1"
            navigationItems={[
              {
                key: "feature-1",
                title: "Epics",
                icon: EpicIcon,

                action: () => console.log("Feature Alpha selected"),
              },
              {
                key: "feature-2",
                title: "Work items",
                icon: LayersIcon,

                // disabled: true,
                action: () => console.log("Feature Beta selected"),
              },
              {
                key: "feature-3",
                title: "Cycles",
                icon: ContrastIcon,

                action: () => console.log("Feature Gamma selected"),
              },
              {
                key: "feature-3",
                title: "Modules",
                icon: GridIcon,

                action: () => console.log("Feature Gamma selected"),
              },
              {
                key: "feature-3",
                title: "Views",
                icon: Layers2,

                action: () => console.log("Feature Gamma selected"),
              },
              {
                key: "feature-3",
                title: "Pages",
                icon: FileIcon,

                action: () => console.log("Feature Gamma selected"),
              },
            ]}
          />
        }
        showSeparator={false}
      />,
      <Breadcrumbs.Item
        key="settings"
        component={<BreadcrumbBlock href="/settings" label="Settings" icon={<Settings className="size-3.5" />} />}
        isLast
      />,
    ],
  },
};
