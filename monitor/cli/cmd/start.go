/*
Copyright © 2024 plane.so engineering@plane.so
*/
package cmd

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/constants/descriptors"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
	"github.com/makeplane/plane-ee/monitor/pkg/handlers"
	"github.com/makeplane/plane-ee/monitor/pkg/types"
	"github.com/makeplane/plane-ee/monitor/pkg/worker"
	"github.com/spf13/cobra"
)

var StartCmd = &cobra.Command{
	Use:   descriptors.CMD_START_USAGE,
	Short: descriptors.CMD_START_USAGE_DESC,
	RunE: func(cmd *cobra.Command, args []string) error {
		healthCheckInterval, err := cmd.Flags().GetInt(descriptors.FLAG_INTERVAL_HEALTHCHECK)
		if err != nil {
			return err
		}

		db.Initialize()

		// If we are upgraded, we need to update all the licenses present inside the
		// DB to the current version

		// Establish signals for catching signal interrupts
		sigs := make(chan os.Signal, 1)
		signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

		// Initializing cronhandler for cron tasks
		cronHandler := handlers.NewCronHandler(types.Credentials{
			InstanceId:       INSTANCE_ID,
			Host:             HOST,
			MachineSignature: MACHINE_SIGNATURE,
			AppDomain:        APP_DOMAIN,
			AppVersion:       APP_VERSION,
		}, CmdLogger)

		api := prime_api.NewMonitorApi(HOST, MACHINE_SIGNATURE, INSTANCE_ID, APP_VERSION)

		// Initializing the http handler for addressing requests
		httpHandler := handlers.NewHttpHandler(handlers.HTTPHandlerOptions{
			Host:       "0.0.0.0",
			Port:       PORT,
			Logger:     *CmdLogger,
			PrivateKey: PRIVATE_KEY,
			Api:        &api,
		})

		instanceHandler := handlers.NewInstanceHandler(api)

		cronHandler.ScheduleCronJobs(handlers.SchedulerOptions{
			HealthCheckInterval: int64(healthCheckInterval),
		})

		/* TODO: If the db has an encrypted cypher then we can instantiate the
		* feature flag engine right away, else we cannot instantiate */

		// Creating a new instance of the worker
		worker := worker.NewPrimeWorker(CmdLogger)

		// Notify the channel on interrupt signals (Ctrl+C)
		go func() {
			<-sigs
			err := instanceHandler.Deactivate()
			if err != nil {
				CmdLogger.Error(context.Background(), err.Error())
			}
			worker.Shutdown()
		}()

		// Registering the Jobs to the cron handler
		worker.RegisterJob("Update Feature Flags", func(ctx context.Context) {
			err := handlers.UpdateFlagsHandler(ctx, api)
			if err != nil {
				CmdLogger.Error(ctx, err.Error())
			}
		})
		worker.RegisterJob("Prime Scheduler", cronHandler.Start)
		worker.RegisterJob("Prime Monitor Router", httpHandler.StartHttpServer)
		worker.RegisterJob("Activate Current Instance", func(ctx context.Context) {
			err := instanceHandler.Activate()
			if err != nil {
				CmdLogger.Error(ctx, err.Error())
			}
		})

		// Starting the Jobs in background
		worker.StartJobsInBackground()
		worker.Wait()

		return nil
	},
}

func init() {
	StartCmd.Flags().Int(descriptors.FLAG_INTERVAL_HEALTHCHECK, 5, descriptors.FLAG_INTERVAL_HEALTHCHECK_USE)
	rootCmd.AddCommand(StartCmd)
}
