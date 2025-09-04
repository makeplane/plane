package prime_cron

import (
	"context"
	"time"

	"github.com/go-co-op/gocron/v2"
	"github.com/makeplane/plane-ee/monitor/lib/healthcheck"
)

type HealthCheckCallback func(serviceStatuses []*healthcheck.HealthCheckStatus, err []*error)

// Registers a new healthcheck job in the prime scheduler, the function takes
// the context of the parent process, defination provided by the gocron and also
// takes in a healthcheck callback, which will be fired when all the status have
// been accumilated and are ready to be sent.
func (s *PrimeScheduler) RegisterNewHealthCheckJob(ctx context.Context, defination gocron.JobDefinition, healthCheckCallback HealthCheckCallback) {
	healthCheckTask := gocron.NewTask(func() {
		healthCheckHandler := healthcheck.NewHealthCheckHandler()
		healthCheckCtx, cancel := context.WithCancel(ctx)
		defer cancel()
		options := healthcheck.HealthCheckOptions{
			MaxRetries:      5,
			ConfirmTries:    3,
			TimeoutDuration: 5 * time.Second,
			RetryDuration:   2 * time.Second,
		}
		accStatus := healthCheckHandler.GetAccumilatedHealthCheck(healthCheckCtx, options)
		healthCheckCallback(accStatus.Statuses, accStatus.Errors)
	})

	s.RegisterJob(defination, healthCheckTask, gocron.WithName("Service Health Check"))
}

func (s *PrimeScheduler) RegisterLicenseRefreshJob(ctx context.Context, defination gocron.JobDefinition, task func(ctx context.Context)) {
	licenseRefreshTask := gocron.NewTask(func() {
		task(context.Background())
	})

	s.RegisterJob(defination, licenseRefreshTask, gocron.WithName("Service License Refresh"))
}
