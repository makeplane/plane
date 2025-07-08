package error_msgs

// ------------------ CMD Errors ----------------------
const (
	APP_VERSION_ABSENT     = "expecting a version to be available in OS Env under 'APP_VERSION', none found"
	API_HOSTNAME_ABSENT    = "expecting a hostname to be available in OS Env under 'API_HOSTNAME', none found"
	INSTANCE_ID_ABSENT     = "expecting an instance id to be available in OS Env under 'INSTANCE_ID', none found"
	APP_DOMAIN_ABSENT      = "expecting a domain to be available in OS Env under 'APP_DOMAIN', none found"
	MACHINE_SIG_ABSENT     = "expecting a signature to be available in OS Env under 'MACHINE_SIGNATURE', none found"
	LICENSE_VERSION_ABSENT = "expecting a version to be available in OS Env under 'LICENSE_VERSION', none found"
	DEPLOY_PLATFORM_ABSENT = "expecting a deploy platform to be available in OS Env under 'DEPLOY_PLATFORM', none found"
	FAILED_INITIALIZATION  = "failed to initialize the instance, with domain %v"
)

// ------------------ Worker Errors -------------------
const (
	WORKER_PREFIX            = "[WORKER] "
	F_WORKER_ALREADY_RUNNING = WORKER_PREFIX + "Worker already running with scheduled %d jobs, and %d finished"
)

// ----------------- CRON Errors ----------------------
const (
	CRON_PREFIX              = "[SCHEDULER] "
	F_ERROR_REPORTING_STATUS = CRON_PREFIX + "Recived Error while reporting health status, %v"
)
