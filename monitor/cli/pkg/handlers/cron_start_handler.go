package handlers

import (
	"context"
	"time"

	"github.com/go-co-op/gocron/v2"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	prime_cron "github.com/makeplane/plane-ee/monitor/lib/cron"
	"github.com/makeplane/plane-ee/monitor/lib/healthcheck"
	"github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/makeplane/plane-ee/monitor/pkg/core"
	"github.com/makeplane/plane-ee/monitor/pkg/types"
)

type CronHandler struct {
	primeSchedulerHandler *PrimeScheduleHandler
	primeScheduler        *prime_cron.PrimeScheduler
	logger                *logger.Handler
	credentials           types.Credentials
}

func NewCronHandler(credentials types.Credentials, logger *logger.Handler) *CronHandler {
	primeSchedulerHandler := NewPrimeScheduleHandler()
	primeScheduler, _ := prime_cron.NewPrimeScheduler(primeSchedulerHandler)
	return &CronHandler{
		primeSchedulerHandler: primeSchedulerHandler,
		primeScheduler:        primeScheduler,
		logger:                logger,
		credentials:           credentials,
	}
}

type SchedulerOptions struct {
	HealthCheckInterval int64
	ResyncFlagsInterval int64
}

// Schedules the cron jobs available for the instance of the prime scheduler
func (h *CronHandler) ScheduleCronJobs(options SchedulerOptions) {
	// Schedular HealthCheck Job for Instances
	h.primeScheduler.RegisterNewHealthCheckJob(
		context.Background(),
		gocron.DurationJob(time.Duration(options.HealthCheckInterval)*time.Minute),
		func(statuses []*healthcheck.HealthCheckStatus, errors []*error) {
			core.RunHealthCheck(h, statuses, errors)
		},
	)

	// Schedule License Refresh Job for Instances
	h.primeScheduler.RegisterLicenseRefreshJob(
		context.Background(),
		gocron.DurationJob(time.Duration(options.ResyncFlagsInterval)*time.Minute),
		func(ctx context.Context) {
			credentials := h.GetCredentials()
			api := prime_api.NewMonitorApi(credentials.Host, credentials.MachineSignature, credentials.InstanceId, credentials.AppVersion)
			err := UpdateFlagsHandler(context.Background(), api)
			if err != nil {
				h.GetLogger().Error(ctx, err.Error())
			}
		},
	)
}

// Get the logger associated with the cron handler
func (h *CronHandler) GetLogger() *logger.Handler {
	return h.logger
}

// Get the credentials associated with the cron handler
func (h *CronHandler) GetCredentials() types.Credentials {
	return h.credentials
}

// Starts the jobs scheduled inside the prime scheduler
func (h *CronHandler) Start(ctx context.Context) {
	done := make(chan bool)
	defer close(done)

	go func() {
		h.primeScheduler.StartWithBlocker()
		done <- true
	}()

	defer h.primeScheduler.Shutdown()

	// If any of these return, the execution ends
	select {
	case <-ctx.Done():
		return
	case <-done:
		return
	}
}
