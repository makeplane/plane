<br /><br />

<p align="center">
<a href="https://plane.so">
  <img src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_logo_.webp" alt="Plane Logo" width="70">
</a>
</p>
<h1 align="center"><b>Plane</b></h1>
<p align="center"><b>Open-source project management that unlocks customer value</b></p>

<p align="center">
<a href="https://discord.com/invite/A92xrEGCge">
<img alt="Discord online members" src="https://img.shields.io/discord/1031547764020084846?color=5865F2&label=Discord&style=for-the-badge" />
</a>
<img alt="Commit activity per month" src="https://img.shields.io/github/commit-activity/m/makeplane/plane?style=for-the-badge" />
</p>

<p align="center">
    <a href="https://dub.sh/plane-website-readme"><b>Website</b></a> •
    <a href="https://git.new/releases"><b>Releases</b></a> •
    <a href="https://dub.sh/planepowershq"><b>Twitter</b></a> •
    <a href="https://dub.sh/planedocs"><b>Documentation</b></a>
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

Meet [Plane](https://dub.sh/plane-website-readme), an open-source project management tool to track issues, run ~sprints~ cycles, and manage product roadmaps without the chaos of managing the tool itself. 🧘‍♀️

> Plane is evolving every day. Your suggestions, ideas, and reported bugs help us immensely. Do not hesitate to join in the conversation on [Discord](https://discord.com/invite/A92xrEGCge) or raise a GitHub issue. We read everything and respond to most.

## 🚀 Installation

Getting started with Plane is simple. Choose the setup that works best for you:

- **Plane Cloud**   
Sign up for a free account on [Plane Cloud](https://app.plane.so)—it's the fastest way to get up and running without worrying about infrastructure.

- **Self-host Plane**  
Prefer full control over your data and infrastructure? Install and run Plane on your own servers. Follow our detailed [deployment guides](https://developers.plane.so/self-hosting/overview) to get started.

| Installation methods | Docs link                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Docker               | [![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://developers.plane.so/self-hosting/methods/docker-compose)         |
| Kubernetes           | [![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)](https://developers.plane.so/self-hosting/methods/kubernetes) |

`Instance admins` can configure instance settings with [God mode](https://developers.plane.so/self-hosting/govern/instance-admin).

## 🌟 Features

- **Issues**  
Efficiently create and manage tasks with a robust rich text editor that supports file uploads. Enhance organization and tracking by adding sub-properties and referencing related issues.

- **Cycles**   
Maintain your team’s momentum with Cycles. Track progress effortlessly using burn-down charts and other insightful tools.

- **Modules**  
Simplify complex projects by dividing them into smaller, manageable modules. 

- **Views**  
Customize your workflow by creating filters to display only the most relevant issues. Save and share these views with ease.

- **Pages**  
Capture and organize ideas using Plane Pages, complete with AI capabilities and a rich text editor. Format text, insert images, add hyperlinks, or convert your notes into actionable items.

- **Analytics**  
Access real-time insights across all your Plane data. Visualize trends, remove blockers, and keep your projects moving forward.

- **Drive** (_coming soon_): The drive helps you share documents, images, videos, or any other files that make sense to you or your team and align on the problem/solution.


## 🛠️ Local development

### Pre-requisites
- Ensure Docker Engine is installed and running.

###  Development setup
Setting up your local environment is simple and straightforward. Follow these steps to get started:

1. Clone the repository:
   ```
   git clone https://github.com/makeplane/plane.git
   ```
2. Navigate to the project folder:
   ```
   cd plane
   ```
3. Create a new branch for your feature or fix:
   ```
   git checkout -b <feature-branch-name>
   ```
4. Run the setup script in the terminal:
   ```
   ./setup.sh
   ```
5. Open the project in an IDE such as VS Code.

6. Review the `.env` files in the relevant folders. Refer to [Environment Setup](./ENV_SETUP.md) for details on the environment variables used.

7. Start the services using Docker:
   ```
   docker compose -f docker-compose-local.yml up -d
   ```

That’s it! You’re all set to begin coding. Remember to refresh your browser if changes don’t auto-reload. Happy contributing! 🎉

## ⚙️ Built with
[![Next JS](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
[![Node JS](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/en)

## 📸 Screenshots

<p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://ik.imagekit.io/w2okwbtu2/Issues_rNZjrGgFl.png?updatedAt=1709298765880"
        alt="Plane Views"
        width="100%"
      />
    </a>
  </p>
<p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://ik.imagekit.io/w2okwbtu2/Cycles_jCDhqmTl9.png?updatedAt=1709298780697"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://ik.imagekit.io/w2okwbtu2/Modules_PSCVsbSfI.png?updatedAt=1709298796783"
        alt="Plane Cycles and Modules"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://ik.imagekit.io/w2okwbtu2/Views_uxXsRatS4.png?updatedAt=1709298834522"
        alt="Plane Analytics"
        width="100%"
      />
    </a>
  </p>
   <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://ik.imagekit.io/w2okwbtu2/Analytics_0o22gLRtp.png?updatedAt=1709298834389"
        alt="Plane Pages"
        width="100%"
      />
    </a>
  </p>
</p>
<p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://ik.imagekit.io/w2okwbtu2/Drive_LlfeY4xn3.png?updatedAt=1709298837917"
        alt="Plane Command Menu"
        width="100%"
      />
    </a>
  </p>
</p>

## 📝 Documentation
Explore Plane's [product documentation](https://docs.plane.so/) and [developer documentation](https://developers.plane.so/) to learn about features, setup, and usage.

## ❤️ Community

Join the Plane community on [GitHub Discussions](https://github.com/orgs/makeplane/discussions) and our [Discord server](https://discord.com/invite/A92xrEGCge). We follow a [Code of conduct](https://github.com/makeplane/plane/blob/master/CODE_OF_CONDUCT.md) in all our community channels.

Feel free to ask questions, report bugs, participate in discussions, share ideas, request features, or showcase your projects. We’d love to hear from you!

## 🛡️ Security

If you discover a security vulnerability in Plane, please report it responsibly instead of opening a public issue. We take all legitimate reports seriously and will investigate them promptly. See [Security policy](https://github.com/makeplane/plane/blob/master/SECURITY.md) for more info.

To disclose any security issues, please email us at security@plane.so. 

## 🤝 Contributing

There are many ways you can contribute to Plane:

- Report [bugs](https://github.com/makeplane/plane/issues/new?assignees=srinivaspendem%2Cpushya22&labels=%F0%9F%90%9Bbug&projects=&template=--bug-report.yaml&title=%5Bbug%5D%3A+) or submit [feature requests](https://github.com/makeplane/plane/issues/new?assignees=srinivaspendem%2Cpushya22&labels=%E2%9C%A8feature&projects=&template=--feature-request.yaml&title=%5Bfeature%5D%3A+).
- Review the [documentation](https://docs.plane.so/) and submit [pull requests](https://github.com/makeplane/docs) to improve it—whether it's fixing typos or adding new content.
- Talk or write about Plane or any other ecosystem integration and [let us know](https://discord.com/invite/A92xrEGCge)!
- Show your support by upvoting [popular feature requests](https://github.com/makeplane/plane/issues).

Please read [CONTRIBUTING.md](https://github.com/makeplane/plane/blob/master/CONTRIBUTING.md) for details on the process for submitting pull requests to us.

### Repo activity

![Plane Repo Activity](https://repobeats.axiom.co/api/embed/2523c6ed2f77c082b7908c33e2ab208981d76c39.svg "Repobeats analytics image")

### We couldn't have done this without you.

<a href="https://github.com/makeplane/plane/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=makeplane/plane" />
</a>


## License
This project is licensed under the [GNU Affero General Public License v3.0](https://github.com/makeplane/plane/blob/master/LICENSE.txt).