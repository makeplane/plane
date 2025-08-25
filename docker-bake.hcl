# docker-bake.hcl
#
# Build all runtime images for Plane services and the AIO assembler image.
# Uses unified Dockerfiles under plane/ for Node (Next.js) apps and API.
#
# Usage examples:
#   # Build all individual runtime images (no push)
#   docker buildx bake
#
#   # Build everything including AIO
#   docker buildx bake all
#
#   # Build and push with custom tag and registry/prefix
#   docker buildx bake all --set *.tags=myrepo/plane-{{.target}}:1.2.3 --push
#
#   # Or set variables:
#   docker buildx bake all --set TAG=1.2.3 --set IMAGE_PREFIX=myrepo/ --push
#
# Notes:
# - The "AIO" image composes from the individual images built here.
# - "live" currently uses its app-specific Dockerfile (non-Next.js runtime).

group "default" {
  targets = ["web", "space", "admin", "live", "api", "proxy"]
}

group "all" {
  targets = ["web", "space", "admin", "live", "api", "proxy", "aio"]
}

group "frontend" {
  targets = ["web", "space", "admin"]
}

variable "TAG" {
  # Global tag to apply to images
  default = "latest"
}

variable "IMAGE_PREFIX" {
  # Optional prefix/registry for image tags, e.g. "ghcr.io/makeplane/" or "yourrepo/"
  # Leave empty to tag locally (e.g. "plane-web:latest")
  default = ""
}

variable "PLATFORMS" {
  # List of platforms (e.g., ["linux/amd64", "linux/arm64"])
  default = ["linux/amd64"]
}

# Common cache configuration for faster CI builds
target "with-cache" {
  cache-from = ["type=gha"]
  cache-to   = ["type=gha,mode=max"]
}

# Common base for Next.js apps using the unified Dockerfile
target "common-node" {
  inherits   = ["with-cache"]
  dockerfile = "Dockerfile.node"
  context    = "."
  platforms  = "${PLATFORMS}"
}

# Frontend apps (Next.js standalone runtime)
target "web" {
  inherits = ["common-node"]
  target   = "runtime"
  args     = { APP_SCOPE = "web" }
  tags     = ["${IMAGE_PREFIX}plane-web:${TAG}"]
}

target "space" {
  inherits = ["common-node"]
  target   = "runtime"
  args     = { APP_SCOPE = "space" }
  tags     = ["${IMAGE_PREFIX}plane-space:${TAG}"]
}

target "admin" {
  inherits = ["common-node"]
  target   = "runtime"
  args     = { APP_SCOPE = "admin" }
  tags     = ["${IMAGE_PREFIX}plane-admin:${TAG}"]
}

# Live app (Node service; not Next.js standalone)
# Keeps its dedicated Dockerfile to match current build/run layout
target "live" {
  inherits   = ["with-cache"]
  dockerfile = "apps/live/Dockerfile.live"
  context    = "."
  platforms  = "${PLATFORMS}"
  tags       = ["${IMAGE_PREFIX}plane-live:${TAG}"]
}

# Python API (unified Dockerfile)
target "api" {
  inherits   = ["with-cache"]
  dockerfile = "Dockerfile.api"
  context    = "."
  target     = "runtime"
  platforms  = "${PLATFORMS}"
  tags       = ["${IMAGE_PREFIX}plane-api:${TAG}"]
}

# Proxy (Caddy with plugins)
target "proxy" {
  inherits   = ["with-cache"]
  dockerfile = "Dockerfile.ce"
  context    = "apps/proxy"
  platforms  = "${PLATFORMS}"
  tags       = ["${IMAGE_PREFIX}plane-proxy:${TAG}"]
}

# All-in-one assembler image
# Composes from previously built runtime images; override args if you use different tags.
target "aio" {
  inherits   = ["with-cache"]
  dockerfile = "Dockerfile.aio"
  context    = "."
  platforms  = "${PLATFORMS}"
  contexts = {
    web_ctx   = "target:web"
    space_ctx = "target:space"
    admin_ctx = "target:admin"
    live_ctx  = "target:live"
    api_ctx   = "target:api"
    proxy_ctx = "target:proxy"
  }
  tags = ["${IMAGE_PREFIX}plane-aio:${TAG}"]
}
