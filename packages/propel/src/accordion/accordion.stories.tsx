import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion } from "./accordion";

const FAQ_ITEMS = [
  {
    id: "faq-1",
    title: "How do I get started?",
    content:
      "Sign up for a free account, create your first project, and invite team members to collaborate. Our quick-start guide will help you set up your workspace in minutes.",
  },
  {
    id: "faq-2",
    title: "What are the pricing plans?",
    content:
      "We offer flexible pricing plans to suit teams of all sizes. Free tier includes basic features, while Pro and Enterprise plans offer advanced capabilities, priority support, and custom integrations.",
  },
  {
    id: "faq-3",
    title: "Is there a mobile app available?",
    content:
      "Yes, we have native mobile apps for both iOS and Android platforms. Download from the respective app stores and stay connected with your team on the go.",
  },
];

const SETTINGS_ITEMS = [
  {
    id: "settings-1",
    title: (
      <div className="flex items-center space-x-3 group">
        <div className="p-1.5 bg-blue-50 rounded-md text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <span className="text-gray-700 group-hover:text-gray-900">Notifications</span>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-gray-700">Email Notifications</span>
            <p className="text-xs text-gray-500">Receive updates via email</p>
          </div>
          <button className="px-2.5 py-1 text-sm bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
            Configure
          </button>
        </div>
      </div>
    ),
  },
  {
    id: "settings-2",
    title: (
      <div className="flex items-center space-x-3 group">
        <div className="p-1.5 bg-purple-50 rounded-md text-purple-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7m-6 4v2m4-2v2"
            />
          </svg>
        </div>
        <span className="text-gray-700 group-hover:text-gray-900">Security</span>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
            <p className="text-xs text-gray-500">Add an extra layer of security</p>
          </div>
          <button className="px-2.5 py-1 text-sm bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
            Enable
          </button>
        </div>
      </div>
    ),
  },
  {
    id: "settings-3",
    title: (
      <div className="flex items-center space-x-3 group">
        <div className="p-1.5 bg-green-50 rounded-md text-green-500 group-hover:bg-green-100 group-hover:text-green-600 transition-colors duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-gray-700 group-hover:text-gray-900">Preferences</span>
      </div>
    ),
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-gray-700">Theme Settings</span>
            <p className="text-xs text-gray-500">Customize your interface</p>
          </div>
          <button className="px-2.5 py-1 text-sm bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
            Customize
          </button>
        </div>
      </div>
    ),
  },
];

const PRODUCT_ITEMS = [
  {
    id: "product-1",
    title: (
      <div className="flex items-center justify-between w-full group">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-inner">
            <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 group-hover:text-gray-900">Project Management</h3>
            <p className="text-xs text-gray-500">Organize and track your work</p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">Popular</span>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Powerful project management tools to help teams plan, track, and deliver their best work. Features include
          task management, timelines, team collaboration, and more.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">Task Management</h4>
            <p className="text-xs text-gray-500 mt-1">Create, assign, and track tasks</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">Team Collaboration</h4>
            <p className="text-xs text-gray-500 mt-1">Work together seamlessly</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "product-2",
    title: (
      <div className="flex items-center justify-between w-full group">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-inner">
            <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 group-hover:text-gray-900">Analytics</h3>
            <p className="text-xs text-gray-500">Track your performance</p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-full">New</span>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Comprehensive analytics tools to help you understand your data and make informed decisions. Monitor trends,
          track performance, and generate insights.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">Real-time Metrics</h4>
            <p className="text-xs text-gray-500 mt-1">Monitor live data</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">Custom Reports</h4>
            <p className="text-xs text-gray-500 mt-1">Generate detailed insights</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "product-3",
    title: (
      <div className="flex items-center justify-between w-full group">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-inner">
            <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 group-hover:text-gray-900">Collaboration</h3>
            <p className="text-xs text-gray-500">Work together effectively</p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-full">Updated</span>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Enhanced collaboration tools to help your team work together more effectively. Share files, communicate in
          real-time, and stay aligned on goals.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">File Sharing</h4>
            <p className="text-xs text-gray-500 mt-1">Share and manage files</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">Real-time Chat</h4>
            <p className="text-xs text-gray-500 mt-1">Instant communication</p>
          </div>
        </div>
      </div>
    ),
  },
];

const HELP_ITEMS = [
  {
    id: "help-1",
    title: "Getting Started Guide",
    content:
      "Learn the basics of our platform with step-by-step tutorials, video guides, and best practices for new users.",
  },
  {
    id: "help-2",
    title: "Troubleshooting Common Issues",
    content:
      "Find solutions to common problems, error messages, and technical issues that you might encounter while using our platform.",
  },
  {
    id: "help-3",
    title: "Contact Support",
    content:
      "Need help? Our support team is available 24/7. You can reach us via email, chat, or phone for assistance with any issues.",
  },
];

const meta = {
  component: Accordion,
  title: "Components/Accordion",
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [],
  },
  render: (args) => (
    <div className="w-full max-w-2xl space-y-8 p-6 bg-white rounded-lg">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Accordion Examples</h2>

      <div className="space-y-8">
        {/* FAQ Example */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Simple Text Accordion</h3>
          <Accordion
            items={FAQ_ITEMS}
            className="bg-white border border-gray-200 divide-y divide-gray-200 rounded-lg shadow-sm transition-all duration-200 ease-in-out hover:border-gray-300"
            itemClassName="first:rounded-t-lg last:rounded-b-lg overflow-hidden"
            triggerClassName="w-full px-4 py-3 text-left text-gray-700 hover:text-gray-900 font-medium flex items-center justify-between transition-colors duration-200"
            panelClassName="px-4 py-3 bg-gray-50/50 text-gray-600 text-sm border-t border-gray-200"
          />
        </div>

        {/* Settings Example */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Icon & Button Accordion</h3>
          <Accordion
            items={SETTINGS_ITEMS}
            className="bg-white border border-gray-200 divide-y divide-gray-200 rounded-lg shadow-sm hover:shadow transition-all duration-200 ease-in-out"
            itemClassName="first:rounded-t-lg last:rounded-b-lg overflow-hidden"
            triggerClassName="w-full px-4 py-3 text-left hover:bg-gray-50/50 transition-colors duration-200"
            panelClassName="px-4 py-3 bg-white border-t border-gray-100"
          />
        </div>

        {/* Product Features */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rich Content Accordion</h3>
          <Accordion
            items={PRODUCT_ITEMS}
            className="bg-white border border-gray-200 divide-y divide-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow transition-all duration-200 ease-in-out"
            itemClassName="first:rounded-t-lg last:rounded-b-lg overflow-hidden"
            triggerClassName="w-full px-4 py-3 text-left hover:bg-gray-50/50 transition-colors duration-200"
            panelClassName="px-4 py-3 bg-white border-t border-gray-100"
          />
        </div>

        {/* Help & Support */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Multi-Select Accordion</h3>
          <Accordion
            items={HELP_ITEMS}
            allowMultiple
            defaultValue={["help-1"]}
            className="bg-white border border-gray-200 divide-y divide-gray-200 rounded-lg shadow-sm hover:shadow transition-all duration-200 ease-in-out"
            itemClassName="first:rounded-t-lg last:rounded-b-lg overflow-hidden"
            triggerClassName="w-full px-4 py-3 text-left text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
            panelClassName="px-4 py-3 bg-gray-50/50 text-gray-600 text-sm border-t border-gray-100"
          />
        </div>
      </div>
    </div>
  ),
};
