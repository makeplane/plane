<br />

<p align="center"><b>Workspaces</b></p>
<p align="center"><b>Engineering operations and project management for HG Software</b></p>

<p align="center">
    <a href="https://workspaces.hgsoftware.com.np"><b>workspaces.hgsoftware.com.np</b></a>
</p>

Workspaces is HG Software's engineering operations platform: projects, cycles, modules and work
items, with an Engineering Operations layer on top — dashboards, daily work logs, operations
tickets, delivery analytics, and an attendance bridge to Odoo.

It is a fork of [Plane](https://plane.so/), an open-source project management tool, and is
licensed under the same terms. See [Upstream](#-upstream) below for what that means in practice.

## 🚀 Deployment

> [!IMPORTANT]
> Workspaces deploys by **building from source**, not from the published `makeplane/*` images.
> Those images contain stock Plane and none of this fork's work. Follow
> [`DEPLOYMENT.md`](DEPLOYMENT.md) — it is the only supported path.

- Deploy, operate, troubleshoot: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Why the deployment files look the way they do, and the merge gate to run after pulling
  upstream: [`docs/deployment/architecture.md`](docs/deployment/architecture.md)
- Migrating an existing install: [`docs/deployment/migration.md`](docs/deployment/migration.md)
- Verify a deployment: `deployments/workspaces/verify.sh https://<domain>`

Instance administrators configure instance settings through God mode at `/god-mode`.

## 🌟 Features

- **Work Items**
  Create and manage tasks with a rich text editor that supports file uploads. Add sub-properties
  and reference related work items.

- **Cycles**
  Keep teams on pace with velocity charts and burn-down.

- **Modules**
  Break large projects into focused, trackable pieces of work.

- **Views**
  Save filter sets and reuse them across the workspace.

- **Pages**
  Capture notes and documents with an AI-capable editor, and turn them into work items.

- **Analytics**
  Real-time insight across every workstream.

- **Engineering Operations**
  Dashboards per role, daily work logs, operations tickets, delivery and quality metrics, and
  attendance through Odoo. See [`PROJECT.md`](PROJECT.md) and
  [`docs/engineering-operations.md`](docs/engineering-operations.md).

## 🛠️ Local development

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, and [`AGENTS.md`](./AGENTS.md) for the
day-to-day commands (`pnpm dev`, `pnpm check`, backend tests).

## ⚙️ Built with

[![React Router](https://img.shields.io/badge/-React%20Router-CA4245?logo=react-router&style=for-the-badge&logoColor=white)](https://reactrouter.com/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
[![Node JS](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/en)

## 🔗 Upstream

Workspaces is built on [Plane](https://github.com/makeplane/plane). Plane's product and developer
documentation still describes most of the core behaviour, and is the best reference for anything
outside the Engineering Operations layer:

- [Plane product documentation](https://docs.plane.so/)
- [Plane developer documentation](https://developers.plane.so/)

Copyright in the upstream code remains with Plane Software, Inc.; the per-file notices are
retained throughout this repository, as the licence requires. Bugs in core Plane behaviour are
best reported upstream at [makeplane/plane](https://github.com/makeplane/plane/issues); bugs in
Workspaces belong in this repository.

## 🛡️ Security

Report a security vulnerability in Workspaces privately to the HG Software engineering team rather
than opening a public issue — see [`SECURITY.md`](SECURITY.md).

For a vulnerability in upstream Plane code, follow
[Plane's security policy](https://github.com/makeplane/plane/blob/master/SECURITY.md).

## License

This project is licensed under the
[GNU Affero General Public License v3.0](LICENSE.txt), inherited from Plane.
