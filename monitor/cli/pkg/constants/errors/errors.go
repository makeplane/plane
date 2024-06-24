package error_msgs

// ------------------ CMD Errors ----------------------
const (
	LICENSE_ABSENT         = "expecting a license to be available in OS Env under 'LICENSE_KEY', none found"
	MACHINE_SIG_ABSENT     = "expecting a signature to be available in OS Env under 'MACHINE_SIGNATURE', none found"
	LICENSE_VERSION_ABSENT = "expecting a version to be available in OS Env under 'LICENSE_VERSION', none found"
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
