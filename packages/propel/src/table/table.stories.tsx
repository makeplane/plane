import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "./core";

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>User</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Wilson</TableCell>
            <TableCell>bob@example.com</TableCell>
            <TableCell>Moderator</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

export const WithCaption: Story = {
  render() {
    return (
      <Table>
        <TableCaption>A list of recent users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice Johnson</TableCell>
            <TableCell>alice@example.com</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Charlie Brown</TableCell>
            <TableCell>charlie@example.com</TableCell>
            <TableCell>Inactive</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

export const WithFooter: Story = {
  render() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Product A</TableCell>
            <TableCell className="text-right">2</TableCell>
            <TableCell className="text-right">$10.00</TableCell>
            <TableCell className="text-right">$20.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Product B</TableCell>
            <TableCell className="text-right">1</TableCell>
            <TableCell className="text-right">$25.00</TableCell>
            <TableCell className="text-right">$25.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Product C</TableCell>
            <TableCell className="text-right">3</TableCell>
            <TableCell className="text-right">$15.00</TableCell>
            <TableCell className="text-right">$45.00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-semibold">
              Total
            </TableCell>
            <TableCell className="text-right font-semibold">$90.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  },
};

export const WithActions: Story = {
  render() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
            <TableCell className="text-right">
              <button className="mr-2 text-blue-500 hover:underline">Edit</button>
              <button className="text-danger-primary hover:underline">Delete</button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>User</TableCell>
            <TableCell className="text-right">
              <button className="mr-2 text-blue-500 hover:underline">Edit</button>
              <button className="text-danger-primary hover:underline">Delete</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

export const WithBadges: Story = {
  render() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Website Redesign</TableCell>
            <TableCell>
              <span className="rounded-full bg-green-100 px-2 py-1 text-11 text-success-primary">In Progress</span>
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-red-100 px-2 py-1 text-11 text-danger-primary">High</span>
            </TableCell>
            <TableCell>John Doe</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Mobile App</TableCell>
            <TableCell>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-11 text-blue-800">Planned</span>
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-11 text-yellow-800">Medium</span>
            </TableCell>
            <TableCell>Jane Smith</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>API Integration</TableCell>
            <TableCell>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-11 text-gray-800">Completed</span>
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-green-100 px-2 py-1 text-11 text-success-primary">Low</span>
            </TableCell>
            <TableCell>Bob Wilson</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

export const WithCheckboxes: Story = {
  render() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input type="checkbox" className="h-4 w-4" aria-label="Select all rows" />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <input type="checkbox" className="h-4 w-4" aria-label="Select row for John Doe" />
            </TableCell>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <input type="checkbox" className="h-4 w-4" aria-label="Select row for Jane Smith" />
            </TableCell>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>User</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <input type="checkbox" className="h-4 w-4" aria-label="Select row for Bob Wilson" />
            </TableCell>
            <TableCell>Bob Wilson</TableCell>
            <TableCell>bob@example.com</TableCell>
            <TableCell>Moderator</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

export const EmptyState: Story = {
  render() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center">
              No results found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

export const LargeDataset: Story = {
  render() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 15 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>{1000 + i}</TableCell>
              <TableCell>User {i + 1}</TableCell>
              <TableCell>user{i + 1}@example.com</TableCell>
              <TableCell>{["Engineering", "Sales", "Marketing", "Support"][i % 4]}</TableCell>
              <TableCell>
                <span
                  className={`rounded-full px-2 py-1 text-11 ${
                    i % 2 === 0 ? "bg-green-100 text-success-primary" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {i % 2 === 0 ? "Active" : "Inactive"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

export const CustomStyling: Story = {
  render() {
    return (
      <Table className="border-2 border-blue-200">
        <TableHeader>
          <TableRow className="bg-blue-100">
            <TableHead className="text-blue-900">Name</TableHead>
            <TableHead className="text-blue-900">Email</TableHead>
            <TableHead className="text-blue-900">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-blue-50">
            <TableCell className="font-semibold">John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow className="hover:bg-blue-50">
            <TableCell className="font-semibold">Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>User</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

export const ResponsiveTable: Story = {
  render() {
    return (
      <div className="w-full max-w-4xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell className="hidden sm:table-cell">john@example.com</TableCell>
              <TableCell className="hidden md:table-cell">Engineering</TableCell>
              <TableCell className="hidden lg:table-cell">New York</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell className="hidden sm:table-cell">jane@example.com</TableCell>
              <TableCell className="hidden md:table-cell">Marketing</TableCell>
              <TableCell className="hidden lg:table-cell">San Francisco</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  },
};
