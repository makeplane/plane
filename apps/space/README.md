<br /><br />

<p align="center">
<a href="https://plane.so">
  <img src="https://plane-marketing.s3.ap-south-1.amazonaws.com/plane-readme/plane_logo_.webp" alt="Plane Logo" width="70">
</a>
</p>

<h3 align="center"><b>Plane Space</b></h3>
<p align="center"><b>Open-source, self-hosted project planning tool</b></p>

Plane Space serves the public view of a Plane instance at `/spaces`: the work items of projects that have been published to the web (`/issues/:anchor`). It is a [React Router](https://reactrouter.com/) app that talks to the Plane API.

## Development

From the repo root, after running `./setup.sh` (which copies `apps/space/.env.example` to `apps/space/.env`) and starting the API (see [CONTRIBUTING.md](../../CONTRIBUTING.md)):

```bash
pnpm dev                                # all apps; space runs on http://localhost:3002
pnpm turbo run dev --filter=space       # only space and its workspace dependencies
```

Other scripts: `pnpm --filter=space build`, `pnpm --filter=space start` (serves the build on port 3002).

## Configuration

`apps/space/.env` sets the URLs of the other services (`VITE_API_BASE_URL`, `VITE_WEB_BASE_URL`, `VITE_ADMIN_BASE_URL`, `VITE_LIVE_BASE_URL`) and the base paths. `VITE_SPACE_BASE_PATH` (default `/spaces`) is used as the router basename.
