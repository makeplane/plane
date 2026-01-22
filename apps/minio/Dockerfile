FROM minio/minio:latest

# MinIO server executable is already in the base image
# This Dockerfile exists for Railway compatibility
# The server command will be provided via Railway service configuration

EXPOSE 9000 9090

# Default command (can be overridden in Railway)
CMD ["minio", "server", "/export", "--console-address", ":9090"]
