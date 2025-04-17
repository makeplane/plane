package constants

// Keys
type key int

const (
	META_KEY key = iota
)

// -------------- Env variables constants -------------------
const (
	MACHINE_SIGNATURE = "MACHINE_SIGNATURE"
	PRIME_HOST        = "PRIME_HOST"
	APP_DOMAIN        = "APP_DOMAIN"
	APP_VERSION       = "APP_VERSION"
	INSTANCE_ID       = "INSTANCE_ID"
	PORT              = "PORT"
	DEPLOY_PLATFORM   = "DEPLOY_PLATFORM"
	DOCKER_COMPOSE    = "DOCKER_COMPOSE"
	KUBERNETES		  = "KUBERNETES"
	COOLIFY			  = "COOLIFY"
)
