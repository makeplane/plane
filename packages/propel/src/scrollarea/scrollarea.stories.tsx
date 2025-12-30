import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "./scrollarea";

const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A customizable scroll area component with multiple size variants, scroll behaviors, and orientations.",
      },
    },
  },
  args: {
    size: "md",
    scrollType: "always",
    orientation: "vertical",
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render(args) {
    return (
      <ScrollArea {...args} className="h-64 w-80 border rounded-lg">
        <div className="p-4 space-y-4">
          <h3 className="text-16 font-semibold">Long Text Content</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
            laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem
            aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          <p>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni
            dolores eos qui ratione voluptatem sequi nesciunt.
          </p>
        </div>
      </ScrollArea>
    );
  },
};

export const Sizes: Story = {
  render() {
    const content = (
      <div className="p-4 space-y-2">
        {[...Array(10)].map((_, i) => (
          <p key={i}>Line {i + 1}: This is some scrollable content to demonstrate different sizes.</p>
        ))}
      </div>
    );

    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="text-13 font-medium">Small</div>
          <ScrollArea className="h-48 w-80 border rounded-lg" size="sm">
            {content}
          </ScrollArea>
        </div>
        <div className="space-y-2">
          <div className="text-13 font-medium">Medium</div>
          <ScrollArea className="h-48 w-80 border rounded-lg" size="md">
            {content}
          </ScrollArea>
        </div>
        <div className="space-y-2">
          <div className="text-13 font-medium">Large</div>
          <ScrollArea className="h-48 w-80 border rounded-lg" size="lg">
            {content}
          </ScrollArea>
        </div>
      </div>
    );
  },
};

export const ScrollTypeAlways: Story = {
  render() {
    return (
      <ScrollArea className="h-64 w-80 border rounded-lg" scrollType="always">
        <div className="p-4 space-y-2">
          <h3 className="text-16 font-semibold">Always Visible Scrollbar</h3>
          {[...Array(15)].map((_, i) => (
            <p key={i}>Line {i + 1}: The scrollbar is always visible.</p>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const ScrollTypeScroll: Story = {
  render() {
    return (
      <ScrollArea className="h-64 w-80 border rounded-lg" scrollType="scroll">
        <div className="p-4 space-y-2">
          <h3 className="text-16 font-semibold">Scroll to Show</h3>
          <p className="text-13 text-placeholder">Scrollbar appears when scrolling</p>
          {[...Array(15)].map((_, i) => (
            <p key={i}>Line {i + 1}: Try scrolling to see the scrollbar appear.</p>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const ScrollTypeHover: Story = {
  render() {
    return (
      <ScrollArea className="h-64 w-80 border rounded-lg" scrollType="hover">
        <div className="p-4 space-y-2">
          <h3 className="text-16 font-semibold">Hover to Show</h3>
          <p className="text-13 text-placeholder">Scrollbar appears on hover</p>
          {[...Array(15)].map((_, i) => (
            <p key={i}>Line {i + 1}: Hover over the area to see the scrollbar.</p>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const HorizontalScroll: Story = {
  render() {
    return (
      <ScrollArea className="h-32 w-96 border rounded-lg" orientation="horizontal">
        <div className="flex gap-4 p-4 w-[1200px]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 h-20 bg-layer-1 rounded-sm flex items-center justify-center">
              Item {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const BothDirections: Story = {
  render() {
    return (
      <ScrollArea className="h-64 w-96 border rounded-lg">
        <div className="w-[800px] p-4 space-y-2">
          <h3 className="text-16 font-semibold">Both Directions</h3>
          <p className="text-13 text-placeholder">Content scrolls both vertically and horizontally</p>
          {[...Array(20)].map((_, i) => (
            <p key={i}>
              Line {i + 1}: This line is very long and extends beyond the container width to demonstrate horizontal
              scrolling along with vertical scrolling.
            </p>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const ListExample: Story = {
  render() {
    return (
      <ScrollArea className="h-80 w-96 border rounded-lg">
        <div className="p-4">
          <h3 className="text-16 font-semibold mb-4">User List</h3>
          <div className="space-y-2">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-layer-1 rounded-sm hover:bg-surface-2 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-on-color font-medium">
                  {String.fromCharCode(65 + (i % 26))}
                </div>
                <div>
                  <div className="font-medium">User {i + 1}</div>
                  <div className="text-13 text-placeholder">user{i + 1}@example.com</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  },
};

export const CodeBlock: Story = {
  render() {
    const code = `function fibonacci(n) {
  if (n <= 1) return n;

  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }

  return b;
}

// Example usage
console.log(fibonacci(10)); // 55
console.log(fibonacci(20)); // 6765

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}`;

    return (
      <ScrollArea className="h-96 w-full max-w-2xl border rounded-lg bg-surface-1">
        <pre className="p-4 text-13">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    );
  },
};

export const ChatMessages: Story = {
  render() {
    return (
      <ScrollArea className="h-96 w-full max-w-md border rounded-lg">
        <div className="p-4 space-y-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`flex ${i % 3 === 0 ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] p-3 rounded-lg ${i % 3 === 0 ? "bg-accent-primary text-on-color" : "bg-layer-1"}`}
              >
                <div className="text-13">{i % 3 === 0 ? "You" : `User ${i + 1}`}</div>
                <div className="mt-1">Message content for message number {i + 1}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const DataTable: Story = {
  render() {
    return (
      <ScrollArea className="h-96 w-full max-w-3xl border rounded-lg">
        <table className="w-full">
          <thead className="bg-layer-1 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(50)].map((_, i) => (
              <tr key={i} className="border-t border-subtle hover:bg-layer-1">
                <td className="px-4 py-2">#{i + 1}</td>
                <td className="px-4 py-2">User {i + 1}</td>
                <td className="px-4 py-2">user{i + 1}@example.com</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-sm text-11 ${i % 3 === 0 ? "bg-success-primary text-success-primary" : "bg-gray-500/20 text-gray-500"}`}
                  >
                    {i % 3 === 0 ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    );
  },
};
