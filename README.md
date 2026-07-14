<br /><br />

<p align="center">
<a href="https://plane.so">
  <img src="https://media.docs.plane.so/logo/plane_github_readme.png" alt="Plane Logo" width="400">
</a>
</p>
<p align="center"><b>Modern project management for all teams</b></p>

<p align="center">
    <a href="https://plane.so/"><b>Website</b></a> •
    <a href="https://forum.plane.so"><b>Forum</b></a> •
    <a href="https://x.com/planepowers"><b>X</b></a> •
    <a href="https://docs.plane.so/"><b>Documentation</b></a>
</p>

<p>
    <a href="https://app.plane.so/#gh-light-mode-only" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-top.webp"
        alt="Plane Screens"
        width="100%"
      />
    </a>
</p>

Meet [Plane](https://plane.so/), an open-source project management tool to track issues, run ~sprints~ cycles, and manage product roadmaps without the chaos of managing the tool itself. 🧘‍♀️

> Plane is evolving every day. Your suggestions, ideas, and reported bugs help us immensely. Do not hesitate to join in the conversation on [Forum](https://forum.plane.so) or raise a GitHub issue. We read everything and respond to most.

## 🚀 Installation

Getting started with Plane is simple. Choose the setup that works best for you:

- **Plane Cloud**
  Sign up for a free account on [Plane Cloud](https://app.plane.so)—it's the fastest way to get up and running without worrying about infrastructure.

- **Self-host Plane**
  Prefer full control over your data and infrastructure? Install and run Plane on your own servers. Follow our detailed [deployment guides](https://developers.plane.so/self-hosting/overview) to get started.

| Installation methods | Docs link                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker               | [![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://developers.plane.so/self-hosting/methods/docker-compose)         |
| Kubernetes           | [![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)](https://developers.plane.so/self-hosting/methods/kubernetes) |

`Instance admins` can configure instance settings with [God mode](https://developers.plane.so/self-hosting/govern/instance-admin).

## 🌟 Features

- **Work Items**
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

## 💰 Payments & Payroll (fork-specific)

Two modules that live behind the per-workspace `payments` feature flag and are
**admin-only**: members and guests get a 403 from the API and never see the
sidebar entry. Enable the flag from the instance admin (god-mode).

Everything lives under one **Payments** page, split into tabs.

### Money rules that apply everywhere

- **Amounts are `Decimal`, never float**, and they cross the wire as strings
  (`"2500.50"`). A float loses cents on a large ledger, so the string stays the
  source of truth until the moment it is formatted for display.
- **Amounts in different currencies are never added together.** Every total is
  grouped by currency — a single figure mixing MXN and USD is a wrong number,
  not a rounding detail.
- **Nothing here moves real money.** It is an internal ledger, not a payment
  gateway.

### Expenses & budgets

A budget allocates an amount to a **category** (Oficina, Viajes…) for a period,
optionally scoped to a project. Expenses record what was actually spent, and
**"spent" is always aggregated from the ledger, never stored** — a stored counter
drifts away from its own rows the first time someone edits an expense.

Supporting documents (invoices, receipts) are uploaded to the same bucket as the
file library and attached to an expense; one expense can carry several. They are
ordinary library assets, so they keep their preview and can be viewed in place —
PDF and images alike.

```
GET /api/workspaces/<slug>/budgets/summary/?from=2026-01-01&to=2026-03-31
→ {"category_name": "Oficina", "currency": "MXN",
   "budgeted": "50000.00", "spent": "12500.75",
   "pending": "3200.00", "remaining": "37499.25"}
```

### Payroll

An **Employee is not a Plane user**. The people on payroll are not necessarily
the people with accounts, so tying the two would force a login for everyone paid
and leak payroll into the member list.

- **Offices** are the companies people are paid from (Seanalytics, Latin…). Each
  office sets its own aguinaldo days.
- **Salaries** belong to an (employee, office) pair, so someone working for two
  companies holds **two salaries at once**.
- **A raise never overwrites.** It closes the running row (`effective_to`) and
  opens a new one, so "what did they earn last March" stays answerable and the
  aguinaldo is computed on the rate that was actually in force.
- **Adjustments** are bonuses, debts and support payments. The amount is always
  positive; the _kind_ carries the direction, so a mistyped minus can't silently
  flip a bonus into a debt.
- **Payments** are disbursements. "Upcoming" is not a separate table — it is the
  `PENDING` rows, so a scheduled payment and the payment it becomes are the same
  record and cannot disagree.

#### Aguinaldo

Computed, never stored. Mexican LFT art. 87: at least 15 days of salary,
proportional to time worked in the year.

```
daily_salary × office.aguinaldo_days × (days_worked_in_year / 365)
```

An employee hired in July gets ~184/365 of the full amount. Someone paid by two
offices is owed aguinaldo by each, on that office's own terms — an office may
grant more than the legal 15, never less.

#### Annual cost — the restricted report

What the workforce costs per year, per office. **Hidden even from workspace
admins**, because the person it must be hidden from _is_ an admin.

There is deliberately **no endpoint to grant it**: an in-app toggle any admin
could flip would be decoration, not a restriction. The grant lives in the
database, and the API answers **404 (not 403)** to anyone without it — a 403
would confirm the report exists, which is itself the thing being kept quiet.

Grant it from the instance shell:

```bash
docker compose -f docker-compose-local.yml exec api python manage.py shell
```

```python
from plane.db.models import PayrollAccess, User, Workspace

PayrollAccess.objects.update_or_create(
    workspace=Workspace.objects.get(slug="your-workspace"),
    user=User.objects.get(email="hr@yourcompany.com"),
    defaults={"can_view_annual_cost": True},
)
```

To revoke, set `can_view_annual_cost=False` (or delete the row). The tab
disappears and the report 404s on the next request.

## 🛠️ Local development

See [CONTRIBUTING](./CONTRIBUTING.md)

## ⚙️ Built with

[![React Router](https://img.shields.io/badge/-React%20Router-CA4245?logo=react-router&style=for-the-badge&logoColor=white)](https://reactrouter.com/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
[![Node JS](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)](https://nodejs.org/en)

## 📸 Screenshots

  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-work-items.webp"
        alt="Plane Views"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-cycles.webp"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-modules.webp"
        alt="Plane Cycles and Modules"
        width="100%"
      />
    </a>
  </p>
  <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-views.webp"
        alt="Plane Analytics"
        width="100%"
      />
    </a>
  </p>
   <p>
    <a href="https://plane.so" target="_blank">
      <img
        src="https://media.docs.plane.so/GitHub-readme/github-analytics.webp"
        alt="Plane Pages"
        width="100%"
      />
    </a>
  </p>
</p>

## 📝 Documentation

Explore Plane's [product documentation](https://docs.plane.so/) and [developer documentation](https://developers.plane.so/) to learn about features, setup, and usage.

## ❤️ Community

Join the Plane community on [GitHub Discussions](https://github.com/orgs/makeplane/discussions) and our [Forum](https://forum.plane.so). We follow a [Code of conduct](https://github.com/makeplane/plane/blob/master/CODE_OF_CONDUCT.md) in all our community channels.

Feel free to ask questions, report bugs, participate in discussions, share ideas, request features, or showcase your projects. We’d love to hear from you!

## 🛡️ Security

If you discover a security vulnerability in Plane, please report it responsibly instead of opening a public issue. We take all legitimate reports seriously and will investigate them promptly. See [Security policy](https://github.com/makeplane/plane/blob/master/SECURITY.md) for more info.

To disclose any security issues, please email us at security@plane.so.

## 🤝 Contributing

There are many ways you can contribute to Plane:

- Report [bugs](https://github.com/makeplane/plane/issues/new?assignees=srinivaspendem%2Cpushya22&labels=%F0%9F%90%9Bbug&projects=&template=--bug-report.yaml&title=%5Bbug%5D%3A+) or submit [feature requests](https://github.com/makeplane/plane/issues/new?assignees=srinivaspendem%2Cpushya22&labels=%E2%9C%A8feature&projects=&template=--feature-request.yaml&title=%5Bfeature%5D%3A+).
- Review the [documentation](https://docs.plane.so/) and submit [pull requests](https://github.com/makeplane/docs) to improve it—whether it's fixing typos or adding new content.
- Talk or write about Plane or any other ecosystem integration and [let us know](https://forum.plane.so)!
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
