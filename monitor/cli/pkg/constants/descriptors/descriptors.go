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
)
