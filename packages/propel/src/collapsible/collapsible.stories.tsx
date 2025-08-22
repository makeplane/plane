import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Collapsible } from "./collapsible";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: {
    docs: {
      description: {
        component: `
A flexible collapsible component that can be used to show/hide content. It supports both controlled and uncontrolled modes,
and can be customized with various styles and behaviors.

## Features
- Controlled and uncontrolled modes
- Customizable trigger button
- Smooth animation
- Accessible by default
- Flexible content support

## Usage
\`\`\`tsx
import { Collapsible } from "@plane/propel";

// Uncontrolled
<Collapsible title="Settings" defaultOpen>
  Content goes here
</Collapsible>

// Controlled
const [isOpen, setIsOpen] = useState(false);
<Collapsible 
  title="Settings" 
  isOpen={isOpen} 
  onToggle={() => setIsOpen(!isOpen)}
>
  Content goes here
</Collapsible>
\`\`\`
`,
      },
    },
  },
  argTypes: {
    title: {
      description: "The title or content of the trigger button",
      control: "text",
    },
    children: {
      description: "The content to be collapsed/expanded",
      control: "text",
    },
    isOpen: {
      description: "Controls the open state (for controlled mode)",
      control: "boolean",
    },
    defaultOpen: {
      description: "Initial open state (for uncontrolled mode)",
      control: "boolean",
    },
    className: {
      description: "Additional classes for the root element",
      control: "text",
    },
    buttonClassName: {
      description: "Additional classes for the trigger button",
      control: "text",
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Collapsible",
    children: "Content",
    className: "border border-gray-200 rounded-md",
    buttonClassName: "w-full px-3 py-2.5 text-left hover:bg-gray-50 font-medium",
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="w-full max-w-2xl space-y-6 p-6 bg-white rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Collapsible Component Showcase</h2>

        {/* Basic Example */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Basic Usage</h3>
          <Collapsible
            title="Click to expand"
            className="bg-white border border-gray-200/75 rounded-md shadow-sm transition-all duration-200 ease-in-out hover:border-gray-300"
            buttonClassName="w-full px-3 py-2.5 text-left text-gray-700 hover:text-gray-900 font-medium flex items-center justify-between transition-colors duration-200 group"
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
          >
            <div className="px-3 py-2.5 bg-gray-50/50 text-gray-600 border-t border-gray-100 rounded-b-md text-sm">
              This is a basic example of the collapsible component with refined hover effects and smooth transitions.
            </div>
          </Collapsible>
        </div>

        {/* Custom Trigger with Icon */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custom Trigger with Icon</h3>
          <Collapsible
            title={
              <div className="flex items-center justify-between w-full group">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-blue-50 rounded-md text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900">Advanced Settings</span>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400 transition-transform duration-200 ease-spring data-[panel-open=true]:rotate-180 group-hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            }
            className="bg-white border border-gray-200/75 rounded-md shadow-sm hover:shadow transition-all duration-200 ease-in-out overflow-hidden"
            buttonClassName="w-full px-3 py-2.5 text-left bg-white transition-colors duration-200"
          >
            <div className="divide-y divide-gray-100">
              <div className="px-3 py-2.5 hover:bg-gray-50/50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-gray-700">Enable notifications</span>
                    <p className="text-xs text-gray-500">Receive updates about system changes</p>
                  </div>
                  <button className="px-2.5 py-1 text-sm bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                    Configure
                  </button>
                </div>
              </div>
              <div className="px-3 py-2.5 hover:bg-gray-50/50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-gray-700">Auto-update settings</span>
                    <p className="text-xs text-gray-500">Keep your system up to date</p>
                  </div>
                  <button className="px-2.5 py-1 text-sm bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </Collapsible>
        </div>

        {/* Rich Content Example */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rich Content</h3>
          <Collapsible
            title={
              <div className="flex items-center justify-between w-full group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-inner">
                    <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 group-hover:text-gray-900">Project Analytics</h3>
                    <p className="text-xs text-gray-500">Real-time performance metrics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-full ring-1 ring-green-600/10">
                    Active
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400 transition-transform duration-200 ease-spring data-[panel-open=true]:rotate-180 group-hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            }
            className="bg-white border border-gray-200/75 rounded-md shadow-sm overflow-hidden hover:shadow transition-all duration-200 ease-in-out"
            buttonClassName="w-full px-3 py-2.5 text-left hover:bg-gray-50/50 transition-colors duration-200"
          >
            <div className="border-t border-gray-100">
              <div className="p-3 bg-gradient-to-b from-white to-gray-50/50">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-md border border-gray-200/75 shadow-sm hover:shadow hover:border-gray-300/75 transition-all duration-200 group">
                    <h4 className="text-xs font-medium text-gray-500 group-hover:text-gray-600">Total Users</h4>
                    <p className="text-xl font-semibold text-gray-800 mt-0.5 group-hover:text-gray-900">1,234</p>
                    <div className="flex items-center mt-0.5 space-x-1 text-green-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      <span className="text-xs font-medium">12% this week</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-md border border-gray-200/75 shadow-sm hover:shadow hover:border-gray-300/75 transition-all duration-200 group">
                    <h4 className="text-xs font-medium text-gray-500 group-hover:text-gray-600">Active Projects</h4>
                    <p className="text-xl font-semibold text-gray-800 mt-0.5 group-hover:text-gray-900">56</p>
                    <div className="flex items-center mt-0.5 space-x-1 text-blue-600">
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      <span className="text-xs font-medium">In progress</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-md border border-gray-200/75 shadow-sm hover:shadow hover:border-gray-300/75 transition-all duration-200 group">
                    <h4 className="text-xs font-medium text-gray-500 group-hover:text-gray-600">Completion Rate</h4>
                    <p className="text-xl font-semibold text-gray-800 mt-0.5 group-hover:text-gray-900">89%</p>
                    <div className="flex items-center mt-0.5 space-x-1 text-green-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      <span className="text-xs font-medium">5% this month</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Collapsible>
        </div>

        {/* Nested Example */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nested Collapsibles</h3>
          <Collapsible
            title={
              <div className="flex items-center justify-between w-full group">
                <span className="text-gray-700 group-hover:text-gray-900">Documentation Sections</span>
                <svg
                  className="w-4 h-4 text-gray-400 transition-transform duration-200 ease-spring data-[panel-open=true]:rotate-180 group-hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            }
            className="bg-white border border-gray-200/75 rounded-md shadow-sm hover:shadow transition-all duration-200 ease-in-out"
            buttonClassName="w-full px-3 py-2.5 text-left hover:bg-gray-50/50 transition-colors duration-200"
            defaultOpen
          >
            <div className="p-3 space-y-2 bg-gray-50/50 rounded-b-md border-t border-gray-100">
              <Collapsible
                title={
                  <div className="flex items-center space-x-2 group">
                    <div className="p-1 bg-blue-50 rounded text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Getting Started</span>
                  </div>
                }
                className="bg-white border border-gray-200/75 rounded-md shadow-sm hover:shadow transition-all duration-200 ease-in-out"
                buttonClassName="w-full px-3 py-2 text-left hover:bg-gray-50/50 text-sm font-medium transition-colors duration-200"
              >
                <div className="p-2.5 text-sm text-gray-600 border-t border-gray-100 bg-white rounded-b-md">
                  Quick start guide and basic concepts to help you get up and running.
                </div>
              </Collapsible>

              <Collapsible
                title={
                  <div className="flex items-center space-x-2 group">
                    <div className="p-1 bg-green-50 rounded text-green-500 group-hover:bg-green-100 group-hover:text-green-600 transition-colors duration-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Advanced Topics</span>
                  </div>
                }
                className="bg-white border border-gray-200/75 rounded-md shadow-sm hover:shadow transition-all duration-200 ease-in-out"
                buttonClassName="w-full px-3 py-2 text-left hover:bg-gray-50/50 text-sm font-medium transition-colors duration-200"
              >
                <div className="p-2.5 text-sm text-gray-600 border-t border-gray-100 bg-white rounded-b-md">
                  Advanced features and customization options for power users.
                </div>
              </Collapsible>
            </div>
          </Collapsible>
        </div>
      </div>
    );
  },
};
