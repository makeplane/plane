# External Deployment

## Portainer

Download the required assets as below 

- `docker-compose.yml` from ⇒ <https://prime.plane.so/deployment/assets/v1.8.0/docker-compose.yml> 
- `variables.env` from ⇒ <https://prime.plane.so/deployment/assets/v1.8.0/variables.env> 

Edit the `variables.env` in your favourite editor for 

- `DOMAIN_NAME`: The domain name of your application
- `APP_RELEASE_VERSION`: The version of the application you want to deploy
- `SITE_ADDRESS`: The FQDN of your application
- `CERT_EMAIL`: The email address of your SSL certificate (only if you want to generate SSL certificate)
- `MACHINE_SIGNATURE`: A unique identifier for your machine ( this can be generated in terminal using command `openssl rand -hex 16` or `uuidgen`)

With above mentioned changes, you are ready to deploy Plane. Create a new stack in Portainer and use the downloaded file to setup Plane (Commercial)

## Coolify

Download the required assets as below 

- `coolify-compose.yml` from ⇒ <https://prime.plane.so/deployment/assets/v1.8.0/coolify-compose.yml> 

Coolify allows you to directly deploy applications using Docker Compose. To deploy Plane on Coolify:

1. Add a new service in Coolify.
2. Select `Docker Compose Empty` as the deployment method.
3. Upload the above downloaded `coolify-compose.yml` file 
4. Configure environment variables using their UI.
5. Deploy the application.

## Swarm

To deploy Plane using Docker Swarm:

Download the required assets as below 

- `docker-compose.yml` from ⇒ <https://prime.plane.so/deployment/assets/v1.8.0/docker-compose.yml> 
- `variables.env` from ⇒ <https://prime.plane.so/deployment/assets/v1.8.0/variables.env> 

Edit the `variables.env` in your favourite editor for 

- `DOMAIN_NAME`: The domain name of your application
- `APP_RELEASE_VERSION`: The version of the application you want to deploy
- `SITE_ADDRESS`: The FQDN of your application
- `CERT_EMAIL`: The email address of your SSL certificate (only if you want to generate SSL certificate)
- `MACHINE_SIGNATURE`: A unique identifier for your machine ( this can be generated in terminal using command `openssl rand -hex 16` or `uuidgen`)

1. Load your environment variables before running the deployment: 

   ```bash
   set -o allexport; source <path-to variables.env>; set +o allexport;
   ```
2. Deploy the stack: 

   ```bash
   docker stack deploy -c deploy/cli-install/docker-caddy.yml plane
   ```
This will deploy the application as a Swarm stack
