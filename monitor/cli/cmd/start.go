/*
Copyright © 2024 plane.so engineering@plane.so
*/
package cmd

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/makeplane/plane-ee/monitor/pkg/constants/descriptors"
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

		// Establish signals for catching signal interrupts
		sigs := make(chan os.Signal, 1)
		signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

		// Initializing cronhandler for cron tasks
		cronHandler := handlers.NewCronHandler(types.Credentials{
			LicenseKey:       LICENSE_KEY,
			LicenseVersion:   LICENSE_VERSION,
			Host:             HOST,
			MachineSignature: MACHINE_SIGNATURE,
		}, CmdLogger)

		// Initializing the http handler for addressing requests
		httpHandler := handlers.NewHttpHandler(handlers.HTTPHandlerOptions{
			Host:   "0.0.0.0",
			Port:   "80",
			Logger: *CmdLogger,
		})

		cronHandler.ScheduleCronJobs(handlers.SchedulerOptions{
			HealthCheckInterval: int64(healthCheckInterval),
		})

		// Creating a new instance of the worker
		worker := worker.NewPrimeWorker(CmdLogger)

		// Notify the channel on interrupt signals (Ctrl+C)
		go func() {
			<-sigs
			worker.Shutdown()
		}()

		// Registering the Jobs to the cron handler
		worker.RegisterJob("Prime Scheduler", cronHandler.Start)
		worker.RegisterJob("Prime Monitor Router", httpHandler.StartHttpServer)

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
