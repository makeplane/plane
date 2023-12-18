# Contributing to Plane

Thank you for showing an interest in contributing to Plane! All kinds of contributions are valuable to us. In this guide, we will cover how you can quickly onboard and make your first contribution.

## Submitting an issue

Before submitting a new issue, please search the [issues](https://github.com/makeplane/plane/issues) tab. Maybe an issue or discussion already exists and might inform you of workarounds. Otherwise, you can give new informplaneation.

While we want to fix all the [issues](https://github.com/makeplane/plane/issues), before fixing a bug we need to be able to reproduce and confirm it. Please provide us with a minimal reproduction scenario using a repository or [Gist](https://gist.github.com/). Having a live, reproducible scenario gives us the information without asking questions back & forth with additional questions like:

- 3rd-party libraries being used and their versions
- a use-case that fails

Without said minimal reproduction, we won't be able to investigate all [issues](https://github.com/makeplane/plane/issues), and the issue might not be resolved.

You can open a new issue with this [issue form](https://github.com/makeplane/plane/issues/new).

## Projects setup and Architecture

### Requirements

- Node.js version v16.18.0
- Python version 3.8+
- Postgres version v14
- Redis version v6.2.7

### Setup the project

The project is a monorepo, with backend api and frontend in a single repo.

The backend is a django project which is kept inside apiserver

1. Clone the repo

```bash
git clone https://github.com/makeplane/plane.git [folder-name]
cd [folder-name]
chmod +x setup.sh
```

2. Run setup.sh

```bash
./setup.sh
```

3. Start the containers

```bash
docker compose -f docker-compose-local.yml up
```


## Missing a Feature?

If a feature is missing, you can directly _request_ a new one [here](https://github.com/makeplane/plane/issues/new?assignees=&labels=feature&template=feature_request.yml&title=%F0%9F%9A%80+Feature%3A+). You also can do the same by choosing "🚀 Feature" when raising a [New Issue](https://github.com/makeplane/plane/issues/new/choose) on our GitHub Repository.
If you would like to _implement_ it, an issue with your proposal must be submitted first, to be sure that we can use it. Please consider the guidelines given below.

## Coding guidelines

To ensure consistency throughout the source code, please keep these rules in mind as you are working:

- All features or bug fixes must be tested by one or more specs (unit-tests).
- We use [Eslint default rule guide](https://eslint.org/docs/rules/), with minor changes. An automated formatter is available using prettier.

## Need help? Questions and suggestions

Questions, suggestions, and thoughts are most welcome. We can also be reached in our [Discord Server](https://discord.com/invite/A92xrEGCge).

## Ways to contribute

- Try Plane Cloud and the self hosting platform and give feedback
- Add new integrations
- Help with open [issues](https://github.com/makeplane/plane/issues) or [create your own](https://github.com/makeplane/plane/issues/new/choose)
- Share your thoughts and suggestions with us
- Help create tutorials and blog posts
- Request a feature by submitting a proposal
- Report a bug
- **Improve documentation** - fix incomplete or missing [docs](https://docs.plane.so/), bad wording, examples or explanations.
