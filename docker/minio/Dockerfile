# Bundled S3-compatible storage for Plane.
#
# MinIO Community images were removed from Docker Hub and anonymous pulls from
# quay.io/minio/minio now return 401. Silo (pgsty/silo) is a maintained MinIO
# fork with the same S3 API, MINIO_* env, mc client, and on-disk layout.
#
# CI publishes this wrapper as makeplane/plane-minio so self-hosted installs
# do not depend on a third-party registry staying public.
ARG SILO_RELEASE=RELEASE.2026-09-16T00-00-00Z
FROM pgsty/silo:${SILO_RELEASE}
