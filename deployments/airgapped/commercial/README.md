### UPGRADE ME

# **Plane Commercial Airgapped Edition**

This guide walks you through setting up the Plane Commercial Airgapped Edition in an offline environment using our pre-packaged installation bundle.

## **Prerequisites**

Before we get started, make sure your air-gapped machine has:

* Docker (version 24 or later) up and running  
* Docker Compose Plugin installed (you should be able to run `docker compose` or `docker-compose`)  
* The Plane air-gapped package we provide includes:  
  * Docker image files (`.tar` format)  
  * Configuration files (`docker-compose.yml` and `plane.env`)  
  * Installation script (`install.sh`)

## Required Files

- `docker-compose.yml` - Docker Compose configuration for service orchestration
- `plane.env` - Default configuration file containing environment variables
- `admin-commercial-<version>.tar` - Docker image for admin service
- `backend-commercial-<version>.tar` - Docker image for api/worker/beat-worker/migrator service
- `email-commercial-<version>.tar` - Docker image for email service
- `live-commercial-<version>.tar` - Docker image for live service
- `monitor-commercial-<version>.tar` - Docker image for monitor service
- `proxy-commercial-<version>.tar` - Docker image for plane-proxy service
- `silo-commercial-<version>.tar` - Docker image for silo service
- `space-commercial-<version>.tar` - Docker image for space service
- `web-commercial-<version>.tar` - Docker image for web service
- `minio-latest.tar` - Docker image for plane-minio service
- `postgres-15.7-alpine.tar` - Docker image for plane-db service
- `rabbitmq-3.13.6-management-alpine.tar` - Docker image for plane-mq service
- `valkey-7.2.5-alpine.tar` - Docker image for plane-redis service

## **Install Plane**

* Get in touch with sales@plane.so to get your installation download URL and license file.  
* On a machine that has internet access, download the installation package:

```shell
curl -LO <asset-download-url>
```

* The download may take 15 minutes.  
* Once the file is downloaded you no longer need internet access.  
* Transfer the `airgapped-{arch}.tar.gz` file to your air-gapped machine.  
* Once you have the file on your air-gapped machine, extract the package.

```shell
mkdir -p airgapped
tar -xvzf airgapped-amd64.tar.gz -C airgapped
cd airgapped
```


* The airgapped directory contains your `plane.env`, `docker-compose.yml`, and `install.sh` files which are used in the following step.  
* Run the installation script:

```shell
bash install.sh
```

* The script will guide you through the process step by step. Here's what to expect:

```shell
**********************************************************
You are about to install/upgrade Plane as airgapped setup

Pre-requisites:  

- Docker installed and running
- Docker version 24 or higher
- docker-compose or docker compose installed
- A tarball of all the images
- A docker-compose.yml file (docker-compose.yml)
- A plane.env file (plane.env)
**********************************************************

Enter the directory to install Plane (default: /home/ubuntu/planeairgapped):

Enter the domain or ip address to access Plane (default: 127.0.0.1): plane.mycompany.com

**********************************************************
Verify the final configuration:
- Setup Directory: /home/ubuntu/planeairgapped
- App Domain: plane.mycompany.com
- Installation Type: New
**********************************************************
```

Once you confirm your settings, the installer will:

* Copy the `docker-compose.yml` and `plane.env` files to your chosen installation directory.  
* Create the necessary folders for data and logs.  
* Load all the Docker images into your local Docker registry.

After installation completes, the following message will be displayed:

```shell
**********************************************************
Plane Setup is ready to configure and start

Use below commands to configure and start Plane
Switch to the setup directory
    cd /home/ubuntu/planeairgapped
Start the services
    docker compose -f docker-compose.yml --env-file plane.env up -d
Check logs of migrator service and wait for it to finish using below command
    docker compose logs -f migrator
Check logs of api service and wait for it to start using below command
    docker compose logs -f api
Once the api service is started, you can access Plane at http://plane.mycompany.com
**********************************************************
Installation completed successfully
You can access Plane at http://plane.mycompany.com
```

Your setup directory structure will look like this:

```shell
~/planeairgapped/
├── docker-compose.yml
├── plane.env
├── data/
└── logs/
```

## Environment Variables

The following key environment variables are automatically configured during installation:

- `MACHINE_SIGNATURE` - A unique UUID generated for your installation
- `DOMAIN_NAME` - The domain or IP address where Plane will be accessible
- `WEB_URL` - The full URL where Plane will be accessible (e.g., http://your-domain)
- `CORS_ALLOWED_ORIGINS` - Allowed origins for CORS (Cross-Origin Resource Sharing)

## **Start Plane**

1. To get Plane up and running, navigate to your setup directory and start the services:

```shell
cd ~/planeairgapped
docker compose --env-file plane.env up -d
```

2. Watch the logs to make sure everything starts properly.

To monitor the database migration process:

```shell
docker compose logs -f migrator
```

To monitor the API service startup:

```shell
docker compose logs -f api
```

The api is healthy when you see`: api-1   listening at`

Once both services are running smoothly, access Plane by opening your browser to the domain or IP address you configured during installation to create your workspace.

## **Activate your license**

Once your air-gapped installation is running, you'll need to activate your workspace with the provided license file.

You should have received the `license_key.json` file as part of your air-gapped package. If you don't have this file, contact our support team.

1. Go to your **Workspace Settings** in the Plane application.  
2. Select **Billing and plans** on the right pane.  
3. Click the **Activate this workspace** button.  
4. Upload the license file `license_key.json` to activate your workspace.

You now have Plane running in your air-gapped environment. If you run into any issues, check the logs using the commands above, or reach out to our support team for assistance.

*\[Optional\]: Once everything is working, you can safely delete the `airgapped` folder that contains the installation script and image files to free up space.*

## Support

If you encounter any issues during installation or need assistance:

- Read our Docs: [Docs](https://docs.plane.so/)
- Email our support team: support@plane.so
