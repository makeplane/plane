FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_DEFAULT_TO_LATEST=0 \
    COREPACK_HOME=/usr/local/share/corepack \
    PATH="/usr/local/bin:${PATH}" \
    BASH_ENV="/etc/profile.d/99-plane-path.sh"

# git and curl are required by Cloud Agents. python3 and build tools cover
# native Node addons (esbuild, swc, msgpackr) when prebuilds are unavailable.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        gnupg \
        sudo \
        xz-utils \
        python3 \
        build-essential \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Matches .node-version and package.json engines.node (>=22.22.0).
# Installed under /usr/local/bin so login shells find it without rc files.
ARG NODE_VERSION=22.22.0
RUN curl --retry 3 --retry-delay 5 -fsSL \
        "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
        | tar -xJ -C /usr/local --strip-components=1 --no-same-owner \
    && mkdir -p /usr/local/share/corepack \
    && corepack enable \
    && corepack prepare pnpm@11.10.0 --activate \
    && chmod -R a+rX /usr/local/share/corepack

RUN printf '%s\n' 'export PATH="/usr/local/bin:${PATH}"' > /etc/profile.d/99-plane-path.sh \
    && printf '%s\n%s\n' 'export PATH="/usr/local/bin:${PATH}"' "$(cat /etc/bash.bashrc)" > /etc/bash.bashrc

########################################################
# DOCKER INSTALLATION
# https://cursor.com/docs/cloud-agent/setup#running-docker
########################################################

RUN install -m 0755 -d /etc/apt/keyrings \
    && curl --retry 3 --retry-delay 5 -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y \
        docker-ce=5:28.5.2-1~ubuntu.24.04~noble \
        docker-ce-cli=5:28.5.2-1~ubuntu.24.04~noble \
        docker-ce-rootless-extras=5:28.5.2-1~ubuntu.24.04~noble \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update \
    && apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" fuse-overlayfs \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /etc/docker \
    && printf '%s\n' '{' \
        '  "storage-driver": "fuse-overlayfs"' \
        '}' > /etc/docker/daemon.json
RUN apt-get update && apt-get install -y iptables && rm -rf /var/lib/apt/lists/*
RUN update-alternatives --set iptables /usr/sbin/iptables-legacy \
    && update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy

# ubuntu:24.04 already has the ubuntu user. Do not useradd it.
# The base image does not install OpenSSH, so create the drop-in directory first.
RUN mkdir -p /etc/ssh/sshd_config.d \
    && printf '%s\n' 'PasswordAuthentication no' 'ChallengeResponseAuthentication no' 'UsePAM no' > /etc/ssh/sshd_config.d/disable_password_auth.conf \
    && groupadd -f docker \
    && usermod -aG docker ubuntu \
    && usermod -aG sudo ubuntu \
    && echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu \
    && chmod 0440 /etc/sudoers.d/ubuntu \
    && chmod 1777 /usr/local/share/corepack

USER ubuntu
WORKDIR /workspace
