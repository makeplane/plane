package descriptors

var (
	PRIME_MONITOR_USAGE      = "prime-client"
	PRIME_MONITOR_USAGE_DESC = "Prime Client is a solution to handle monitoring tasks for plane services ecosystem"

	CMD_CRON_USAGE      = "cron"
	CMD_CRON_USAGE_DESC = "Cron command facilitates you with the cron jobs available as part of monitor"

	CMD_START_USAGE      = "start"
	CMD_START_USAGE_DESC = "Start registers and starts the existing jobs such as cron, http etc."

	HEALTHY   = "healthy"
	UNHEALTHY = "unhealthy"
)

// --------------------- Cmd Flags --------------------------
var (
	FLAG_INTERVAL_HEALTHCHECK     = "interval-healthcheck"
	FLAG_INTERVAL_HEALTHCHECK_USE = "Interval (in minutes) to run health check cron job"

	FLAG_INTERVAL_RESYNC     = "interval-resync"
	FLAG_INTERVAL_RESYNC_USE = "Interval (in minutes) to resync license data and flags"
)

// --------------------- Worker Descriptors -----------------
const (
	WORKER_PREFIX       = "[WORKER] "
	F_REGISTER_JOB      = WORKER_PREFIX + "Registered Job with identifier %s."
	F_START_JOB         = WORKER_PREFIX + "Started Job with identifier %s."
	F_SHUTTING_DOWN_JOB = WORKER_PREFIX + "Shutting Down Job with identifier %s"
	F_EXITED_JOB        = WORKER_PREFIX + "Job with Identifier %s completed execution."
	SHUTTING_DOWN       = WORKER_PREFIX + "Shutting Down, Gracefully stopping job executions."
)

// --------------------- Cron Descriptors -------------------
const (
	CRON_PREFIX              = "[SCHEDULER] "
	F_UNHEALTHY_STATUS_MSG   = CRON_PREFIX + "Recieved Non Healthy Status Code (%d) from Service (%v), Unhealthy"
	F_UNREACHABLE_STATUS_MSG = CRON_PREFIX + "Recieved Non Healthy Status Code (%d) from Service (%v), Not Reachable"
	F_HEALTHY_STATUS_MSG     = CRON_PREFIX + "Recieved Service (%v) status code (%d)"
	F_RECIEVED_ERROR         = CRON_PREFIX + "Health Check Job returned not nil error message (%v)"
)
