# One-click deploy

Deployment methods for Plane have improved significantly to make self-managing super-easy. One of those is a single-line-command installation of Plane.

This short guide will guide you through the process, the background tasks that run with the command for the Community, One, and Enterprise editions, and the post-deployment configuration options available to you.

### Requirements

- Operating systems: Debian, Ubuntu, CentOS
- Supported CPU architectures: AMD64, ARM64, x86_64, AArch64

### Download the latest stable release

Run ↓ on any CLI.

```
curl -fsSL https://raw.githubusercontent.com/makeplane/plane/master/deploy/1-click/install.sh | sh -
```

### Download the Preview release

`Preview` builds do not support ARM64, AArch64 CPU architectures

Run ↓ on any CLI.

```
export BRANCH=preview
curl -fsSL https://raw.githubusercontent.com/makeplane/plane/preview/deploy/1-click/install.sh | sh -
```

---

### Successful installation

You should see ↓ if there are no hitches. That output will also list the IP address you can use to access your Plane instance.

![Install Output](images/install.png)

---

### Manage your Plane instance

Use `plane-app` [OPERATOR] to manage your Plane instance easily. Get a list of all operators with `plane-app ---help`.

![Plane Help](images/help.png)

1. Basic operators

   1. `plane-app start` starts the Plane server.
   2. `plane-app restart` restarts the Plane server.
   3. `plane-app stop` stops the Plane server.

2. Advanced operators

   `plane-app --configure` will show advanced configurators.

   - Change your proxy or listening port
     <br>Default: 80
   - Change your domain name
     <br>Default: Deployed server's public IP address
   - File upload size
     <br>Default: 5MB
   - Specify external database address when using an external database
     <br>Default: `Empty`
     <br>`Default folder: /opt/plane/data/postgres`
   - Specify external Redis URL when using external Redis
     <br>Default: `Empty`
     <br>`Default folder: /opt/plane/data/redis`
   - Configure AWS S3 bucket
     <br>Use only when you or your users want to use S3
     <br>`Default folder: /opt/plane/data/minio`

3. Version operators

   1. `plane-app --upgrade` gets the latest stable version of `docker-compose.yaml`, `.env`, and Docker images
   2. `plane-app --update-installer` updates the installer and the `plane-app` utility.
   3. `plane-app --uninstall` uninstalls the Plane application and all Docker containers from the server but leaves the data stored in
      Postgres, Redis, and Minio alone.
   4. `plane-app --install` installs the Plane app again.
