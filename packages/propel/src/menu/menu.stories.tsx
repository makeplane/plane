import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings, User, LogOut, Mail, Bell, HelpCircle } from "lucide-react";
import { Menu } from "./menu";

const meta = {
  title: "Components/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  subcomponents: {
    MenuItem: Menu.MenuItem,
    SubMenu: Menu.SubMenu,
  },
  args: {
    children: null,
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <Menu label="Options">
        <Menu.MenuItem onClick={() => alert("Option 1 clicked")}>Option 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 2 clicked")}>Option 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 3 clicked")}>Option 3</Menu.MenuItem>
      </Menu>
    );
  },
};

export const WithIcons: Story = {
  render() {
    return (
      <Menu label="Account">
        <Menu.MenuItem onClick={() => alert("Profile")}>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Settings")}>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Messages")}>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Messages</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Logout")}>
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </div>
        </Menu.MenuItem>
      </Menu>
    );
  },
};

export const Ellipsis: Story = {
  render() {
    return (
      <Menu ellipsis>
        <Menu.MenuItem onClick={() => alert("Edit")}>Edit</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Duplicate")}>Duplicate</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Delete")}>Delete</Menu.MenuItem>
      </Menu>
    );
  },
};

export const VerticalEllipsis: Story = {
  render() {
    return (
      <Menu verticalEllipsis>
        <Menu.MenuItem onClick={() => alert("Edit")}>Edit</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Duplicate")}>Duplicate</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Delete")}>Delete</Menu.MenuItem>
      </Menu>
    );
  },
};

export const NoBorder: Story = {
  render() {
    return (
      <Menu label="Actions" noBorder>
        <Menu.MenuItem onClick={() => alert("Action 1")}>Action 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Action 2")}>Action 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Action 3")}>Action 3</Menu.MenuItem>
      </Menu>
    );
  },
};

export const NoChevron: Story = {
  render() {
    return (
      <Menu label="Menu" noChevron>
        <Menu.MenuItem onClick={() => alert("Item 1")}>Item 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")}>Item 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 3")}>Item 3</Menu.MenuItem>
      </Menu>
    );
  },
};

export const Disabled: Story = {
  render() {
    return (
      <Menu label="Disabled Menu" disabled>
        <Menu.MenuItem onClick={() => alert("Item 1")}>Item 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")}>Item 2</Menu.MenuItem>
      </Menu>
    );
  },
};

export const DisabledItems: Story = {
  render() {
    return (
      <Menu label="Options">
        <Menu.MenuItem onClick={() => alert("Enabled")}>Enabled Item</Menu.MenuItem>
        <Menu.MenuItem disabled>Disabled Item</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Enabled")}>Another Enabled Item</Menu.MenuItem>
      </Menu>
    );
  },
};

export const CustomButton: Story = {
  render() {
    return (
      <Menu
        customButton={
          <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">Custom Button</button>
        }
      >
        <Menu.MenuItem onClick={() => alert("Option 1")}>Option 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 2")}>Option 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 3")}>Option 3</Menu.MenuItem>
      </Menu>
    );
  },
};

export const WithSubmenu: Story = {
  render() {
    return (
      <Menu label="File">
        <Menu.MenuItem onClick={() => alert("New File")}>New File</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Open")}>Open</Menu.MenuItem>
        <Menu.SubMenu
          trigger="Export"
          className="min-w-[12rem] rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200"
        >
          <Menu.MenuItem onClick={() => alert("Export as PDF")}>Export as PDF</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Export as CSV")}>Export as CSV</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Export as JSON")}>Export as JSON</Menu.MenuItem>
        </Menu.SubMenu>
        <Menu.MenuItem onClick={() => alert("Close")}>Close</Menu.MenuItem>
      </Menu>
    );
  },
};

export const MaxHeightSmall: Story = {
  render() {
    return (
      <Menu label="Small Height" maxHeight="sm">
        {Array.from({ length: 10 }, (_, i) => (
          <Menu.MenuItem key={i} onClick={() => alert(`Item ${i + 1}`)}>
            Item {i + 1}
          </Menu.MenuItem>
        ))}
      </Menu>
    );
  },
};

export const MaxHeightLarge: Story = {
  render() {
    return (
      <Menu label="Large Height" maxHeight="lg">
        {Array.from({ length: 15 }, (_, i) => (
          <Menu.MenuItem key={i} onClick={() => alert(`Item ${i + 1}`)}>
            Item {i + 1}
          </Menu.MenuItem>
        ))}
      </Menu>
    );
  },
};

export const ComplexMenu: Story = {
  render() {
    return (
      <Menu label="More Actions" buttonClassName="bg-gray-100">
        <Menu.MenuItem onClick={() => alert("Notifications")}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            <span className="ml-auto rounded-sm bg-red-500 px-2 py-0.5 text-11 text-on-color">3</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Help")}>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Help Center</span>
          </div>
        </Menu.MenuItem>
        <Menu.SubMenu
          trigger="Settings"
          className="min-w-[12rem] rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200"
        >
          <Menu.MenuItem onClick={() => alert("General Settings")}>General</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Privacy Settings")}>Privacy</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Security Settings")}>Security</Menu.MenuItem>
        </Menu.SubMenu>
        <div className="my-1 border-t border-gray-200" />
        <Menu.MenuItem onClick={() => alert("Logout")}>
          <div className="flex items-center gap-2 text-danger-primary">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </div>
        </Menu.MenuItem>
      </Menu>
    );
  },
};

export const CustomStyles: Story = {
  render() {
    return (
      <Menu
        label="Styled Menu"
        buttonClassName="bg-purple-500 text-on-color hover:bg-purple-600"
        optionsClassName="bg-purple-50 border-purple-300"
      >
        <Menu.MenuItem onClick={() => alert("Item 1")} className="hover:bg-purple-200">
          Item 1
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")} className="hover:bg-purple-200">
          Item 2
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 3")} className="hover:bg-purple-200">
          Item 3
        </Menu.MenuItem>
      </Menu>
    );
  },
};
