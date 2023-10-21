<br /><br />

<p align="center">
<a href="https://plane.so">
  <img src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_logo_.webp" alt="Plane Logo" width="70">
</a>
</p>

<h3 align="center"><b>Plane</b></h3>
<p align="center"><b>Open-source, self-hosted project planning tool</b></p>

<p align="center">
<a href="https://discord.com/invite/A92xrEGCge">
<img alt="Discord online members" src="https://img.shields.io/discord/1031547764020084846?color=5865F2&label=Discord&style=for-the-badge" />
</a>
<img alt="Commit activity per month" src="https://img.shields.io/github/commit-activity/m/makeplane/plane?style=for-the-badge" />
</p>

<p>
    <a href="https://app.plane.so/#gh-light-mode-only" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_screen.webp"
        alt="Plane Screens"
        width="100%"
      />
    </a>
    <a href="https://app.plane.so/#gh-dark-mode-only" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_screens_dark_mode.webp"
        alt="Plane Screens"
        width="100%"
      />
    </a>
</p>

Meet [Plane](https://plane.so). An open-source software development tool to manage issues, sprints, and product roadmaps with peace of mind 🧘‍♀️.

> Plane is still in its early days, not everything will be perfect yet, and hiccups may happen. Please let us know of any suggestions, ideas, or bugs that you encounter on our [Discord](https://discord.com/invite/A92xrEGCge) or GitHub issues, and we will use your feedback to improve on our upcoming releases.

The easiest way to get started with Plane is by creating a [Plane Cloud](https://app.plane.so) account. Plane Cloud offers a hosted solution for Plane. If you prefer to self-host Plane, please refer to our [deployment documentation](https://docs.plane.so/self-hosting).

## ⚡️ Contributors Quick Start

### Prerequisite

Development system must have docker engine installed and running.

### Steps

Setting up local environment is extremely easy and straight forward. Follow the below step and you will be ready to contribute

1. Clone the code locally using `git clone https://github.com/makeplane/plane.git`
1. Switch to the code folder `cd plane`
1. Create your feature or fix branch you plan to work on using `git checkout -b <feature-branch-name>`
1. Open terminal and run `./setup.sh`
1. Open the code on VSCode or similar equivalent IDE
1. Review the `.env` files available in various folders. Visit [Environment Setup](./ENV_SETUP.md) to know about various environment variables used in system
1. Run the docker command to initiate various services `docker compose -f docker-compose-local.yml up -d`

```bash
./setup.sh
```

You are ready to make changes to the code. Do not forget to refresh the browser (in case id does not auto-reload)

Thats it!

## 🍙 Self Hosting

For self hosting environment setup, visit the [Self Hosting](https://docs.plane.so/self-hosting) documentation page

## 🚀 Features

- **Issue Planning and Tracking**: Quickly create issues and add details using a powerful rich text editor that supports file uploads. Add sub-properties and references to issues for better organization and tracking.
- **Issue Attachments**: Collaborate effectively by attaching files to issues, making it easy for your team to find and share important project-related documents.
- **Layouts**: Customize your project view with your preferred layout - choose from List, Kanban, or Calendar to visualize your project in a way that makes sense to you.
- **Cycles**: Plan sprints with Cycles to keep your team on track and productive. Gain insights into your project's progress with burn-down charts and other useful features.
- **Modules**: Break down your large projects into smaller, more manageable modules. Assign modules between teams to easily track and plan your project's progress.
- **Views**: Create custom filters to display only the issues that matter to you. Save and share your filters in just a few clicks.
- **Pages**: Plane pages function as an AI-powered notepad, allowing you to easily document issues, cycle plans, and module details, and then synchronize them with your issues.
- **Command K**: Enjoy a better user experience with the new Command + K menu. Easily manage and navigate through your projects from one convenient location.
- **GitHub Sync**: Streamline your planning process by syncing your GitHub issues with Plane. Keep all your issues in one place for better tracking and collaboration.

## 📸 Screenshots

<p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_views_dark_mode.webp"
        alt="Plane Views"
        width="100%"
      />
    </a>
  </p>
<p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_issue_detail_dark_mode.webp"
        alt="Plane Issue Details"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_cycles_modules_dark_mode.webp"
        alt="Plane Cycles and Modules"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_analytics_dark_mode.webp"
        alt="Plane Analytics"
        width="100%"
      />
    </a>
  </p>
   <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_pages_dark_mode.webp"
        alt="Plane Pages"
        width="100%"
      />
    </a>
  </p>
</p>
   <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_commad_k_dark_mode.webp"
        alt="Plane Command Menu"
        width="100%"
      />
    </a>
  </p>
</p>

## 📚Documentation

For full documentation, visit [docs.plane.so](https://docs.plane.so/)

To see how to Contribute, visit [here](https://github.com/makeplane/plane/blob/master/CONTRIBUTING.md).

## ❤️ Community

The Plane community can be found on GitHub Discussions, where you can ask questions, voice ideas, and share your projects.

To chat with other community members you can join the [Plane Discord](https://discord.com/invite/A92xrEGCge).

Our [Code of Conduct](https://github.com/makeplane/plane/blob/master/CODE_OF_CONDUCT.md) applies to all Plane community channels.

## ⛓️ Security

If you believe you have found a security vulnerability in Plane, we encourage you to responsibly disclose this and not open a public issue. We will investigate all legitimate reports. Email engineering@plane.so to disclose any security vulnerabilities.
