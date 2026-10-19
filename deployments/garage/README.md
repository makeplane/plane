# Use Garage as Plane's object store (self-managed)

Plane's Docker Compose install bundles MinIO (`pgsty/silo`) as the object store for attachments, images, avatars,
covers and exports. If you'd rather run [Garage](https://garagehq.deuxfleurs.fr), a lightweight S3-compatible
store, this directory has what you need to deploy it next to Plane, move your existing files into it, and
connect Plane to it.

> **You run Garage, not Plane.** Garage is not part of the Plane installation: installing, upgrading,
> backing up, monitoring and securing it is your responsibility. Plane talks to it as any S3-compatible
> store.

| File | Purpose |
|---|---|
| `docker-compose.yml` | Runs Garage on Plane's Docker network (`plane-app_default`), where Plane reaches it as `http://garage:3900` |
| `garage.toml` | Garage config: single node, SQLite metadata, fsync on, metadata snapshots every 6 hours |
| `migrate-minio-to-garage.sh` | Copies the files from Plane's bundled MinIO into a Garage data directory and verifies them |

## Requirements

- **Plane vX.Y.Z or newer**, installed with `setup.sh` (Docker Compose). From that release, Plane's proxy
  follows `AWS_S3_ENDPOINT_URL`. Earlier releases always send file traffic to the bundled MinIO. Docker
  Swarm installs aren't covered here.
- Docker with Compose v2.
- Disk for Garage: about 1.2× the size of your files. Check with `docker system df -v | grep plane-app_uploads`.

Plane's `setup.sh` works on the `plane-app/` folder in the directory you run it from, so the commands below call it
as `(cd .. && ./setup.sh)` from inside `garage/`.

## 1. Prepare Garage

Put this directory next to `plane-app/`, for example as `garage/`, and work from it:

```sh
cd garage
```

Then follow **one** of the two paths.

### 1a. You already have files in Plane (migrate from the bundled MinIO)

1. Stop Plane, so nothing writes to MinIO during the copy: run `(cd .. && ./setup.sh)` and choose **Stop**.
2. Copy the files into Garage's data directory. Plane's MinIO data lives in the Docker volume
   `plane-app_uploads`:
   ```sh
   VERIFY_CONTENT=1 ./migrate-minio-to-garage.sh plane-app_uploads "$PWD/data"
   ```
   - The script runs MinIO (read-only) and Garage temporarily, copies the bucket, then checks names,
     sizes and the object count. `VERIFY_CONTENT=1` also compares the checksum of every file; leave it
     out on very large stores to save time.
   - It never changes your MinIO data.
   - It writes `garage.env` (Garage's secrets and the key Plane will use, readable only by you) and prints
     the settings for step 2.
   - If it stops partway, run it again: it reuses `garage.env` and copies only what's missing.

### 1b. New installation, or you don't need the existing files

Create Garage's secrets and the key Plane will use:

```sh
umask 077
cat > garage.env <<EOF
GARAGE_RPC_SECRET=$(openssl rand -hex 32)
GARAGE_ADMIN_TOKEN=$(openssl rand -hex 32)
GARAGE_DEFAULT_ACCESS_KEY=GK$(openssl rand -hex 12)
GARAGE_DEFAULT_SECRET_KEY=$(openssl rand -hex 32)
GARAGE_DEFAULT_BUCKET=uploads
EOF
```

## 2. Connect Plane to Garage

In `plane-app/plane.env`, set these. Take the key and secret from `garage.env`
(`GARAGE_DEFAULT_ACCESS_KEY` / `GARAGE_DEFAULT_SECRET_KEY`) or from the migration script's output:

```
USE_MINIO=1
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<GARAGE_DEFAULT_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<GARAGE_DEFAULT_SECRET_KEY>
AWS_S3_BUCKET_NAME=uploads
AWS_S3_ENDPOINT_URL=http://garage:3900
```

- `USE_MINIO=1` keeps file traffic flowing through Plane's own proxy, so browsers never need to reach
  Garage directly.
- The proxy forwards file requests to whatever `AWS_S3_ENDPOINT_URL` names.
- `AWS_REGION` must equal `s3_region` in `garage.toml`.

Start Plane with `(cd .. && ./setup.sh)` → **Start**. Start Plane **before** Garage: Plane creates the
`plane-app_default` network that Garage joins. Until Garage is up in step 3, file uploads and downloads fail.

The bundled MinIO container keeps running but is no longer used.

## 3. Start Garage on Plane's network

```sh
docker compose up -d
docker compose ps        # garage should show "healthy"
```

On first start, Garage sets up its single-node layout and creates the access key and bucket from
`garage.env`. On later starts that step does nothing.

If your Plane install uses a different folder name, find its network with `docker network ls` and save it
before starting Garage: `echo "PLANE_NETWORK=<name>" > .env`. Compose reads `.env` on every command in this
directory. Don't add `--env-file`: it stops Compose from reading `.env`.

Garage stays attached to Plane's network across Plane restarts. If Plane is stopped while Garage runs,
Docker keeps the network and may print `network … has active endpoints`. That's expected.

## 4. Check it works

- Open older content: work-item attachments, images in descriptions and pages, project covers,
  workspace logos and profile pictures.
- Upload a new file and open it.
- `docker compose logs --tail 20 garage` shows the requests arriving.

## Roll back to the bundled MinIO

Your MinIO data in the `plane-app_uploads` volume is untouched until you delete it.

1. Restore the previous values of `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_S3_ENDPOINT_URL`
   (`http://plane-minio:9000`) in `plane-app/plane.env`. On this install the bundled MinIO also uses the
   access key and secret as its own login.
2. Restart Plane with `(cd .. && ./setup.sh)` → **Restart**.

Files uploaded while Plane used Garage exist only in Garage. To keep them, copy them back before switching,
for example with `mc mirror` from Garage to MinIO.

Once you're satisfied with Garage, typically after a week, reclaim the space. Docker won't remove the volume
while the MinIO container exists, and **Stop** removes Plane's containers:

1. Stop Plane with `(cd .. && ./setup.sh)` → **Stop**.
2. Run `docker volume rm plane-app_uploads`.
3. Start Plane with `(cd .. && ./setup.sh)` → **Start**. Compose creates a new, empty `plane-app_uploads` for the
   unused MinIO container, so after this you can't roll back to MinIO without copying your files back first.

## Operating Garage

### Back up

Back up both `garage.env` (without it, nothing can authenticate to your data) and the `data/` directory.

- **Metadata:** take a consistent snapshot without stopping Garage:
  `docker compose exec garage /garage meta snapshot`. Snapshots are written to `data/meta/snapshots/`, and
  Garage also takes one every 6 hours on its own.
- **Files:** back up `data/data/` after the metadata snapshot, so every block the metadata refers to is
  included.
- For a fully consistent copy, stop Garage, back up `data/`, then start it again.

### Restore from a metadata snapshot

1. Stop Garage.
2. Replace `data/meta/db.sqlite` with the snapshot's `db.sqlite`, and delete any `db.sqlite-wal` and
   `db.sqlite-shm` files.
3. Start Garage, then run `docker compose exec garage /garage repair --yes blocks`.

Changes made after the snapshot are lost.

### Upgrade

Read the [release notes](https://git.deuxfleurs.fr/Deuxfleurs/garage/releases) first. Then change the
`image:` tag in `docker-compose.yml` and run `docker compose up -d`. Back up before
upgrading across a major version.

### Monitor

- **Health:** `docker compose ps` should show `healthy`.
- **Disk:** watch free space on the filesystem that holds `data/`. Garage stops accepting uploads when the
  disk is full.
- **Integrity:** run `docker compose exec garage /garage repair --yes scrub start` periodically to verify
  stored blocks.

### Things to know

- **Single node, no redundancy.** A lost disk means lost files unless you have backups.
- **Key rotation.** Garage refuses to start if `GARAGE_DEFAULT_ACCESS_KEY` exists with a different
  `GARAGE_DEFAULT_SECRET_KEY`. To rotate, create a new key with `/garage key create` and
  `/garage bucket allow --read --write --owner uploads --key <new key>`. Then update both
  `plane-app/plane.env` and `garage.env`, and delete the old key.
- **No anonymous reads.** Plane always serves files through signed URLs, so normal use is unaffected. Links
  that very old Plane releases saved as plain `/uploads/<file>` addresses don't load from Garage. The
  migration script warns when the old bucket allowed anonymous reads.
- **Region.** `AWS_REGION` in `plane.env` must equal `s3_region` in `garage.toml`, or uploads fail with
  `AuthorizationHeaderMalformed`.

### Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Garage exits with `Secret keys should be at least 16 characters long` | `GARAGE_DEFAULT_SECRET_KEY` is too short. Generate one with `openssl rand -hex 32` |
| Garage exits with `Invalid RPC secret key` | `GARAGE_RPC_SECRET` must be exactly 64 hex characters |
| `network plane-app_default not found` when starting Garage | Start Plane first (step 2), or save `PLANE_NETWORK=<network>` in `.env` (step 3) |
| Script: `container … is using plane-app_uploads` | Plane is still running. Stop it first |
| Script: `not enough space` | Free up disk, or point the second argument at a larger disk |
| Uploads fail after switching | Check that Garage is running and `healthy`, that `AWS_REGION` matches `s3_region`, and that you're on Plane vX.Y.Z or newer |
