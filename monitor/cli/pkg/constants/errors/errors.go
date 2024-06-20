package error_msgs

// ------------------ CMD Errors ----------------------
const (
	LICENSE_ABSENT         = "expecting a license to be available in OS Env under 'LICENSE_KEY', none found"
	MACHINE_SIG_ABSENT     = "expecting a signature to be available in OS Env under 'MACHINE_SIGNATURE', none found"
	LICENSE_VERSION_ABSENT = "expecting a version to be available in OS Env under 'LICENSE_VERSION', none found"
)
