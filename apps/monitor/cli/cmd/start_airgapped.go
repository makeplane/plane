/*
Copyright © 2024 plane.so engineering@plane.so
*/
package cmd

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/lib/feat_flag"
	"github.com/makeplane/plane-ee/monitor/pkg/constants/descriptors"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
	"github.com/makeplane/plane-ee/monitor/pkg/handlers"
	"github.com/makeplane/plane-ee/monitor/pkg/types"
	"github.com/makeplane/plane-ee/monitor/pkg/worker"
	"github.com/spf13/cobra"
)

var StartAirgappedCmd = &cobra.Command{
	Use:   "start-airgapped", // TODO: Move this to constants
	Short: descriptors.CMD_START_USAGE_DESC,
	RunE: func(cmd *cobra.Command, args []string) error {
		db.Initialize()

		_, err := feat_flag.ParsePrivateKey(PRIVATE_KEY)
		if err != nil {
			return err
		}

		// Establish signals for catching signal interrupts
		sigs := make(chan os.Signal, 1)
		signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

		// Pass the airgapped api to the http handler
		api := prime_api.NewAirgappedApi(PRIVATE_KEY, API_HOSTNAME, APP_VERSION)

		// Initializing the http handler for addressing requests
		httpHandler := handlers.NewHttpHandler(handlers.HTTPHandlerOptions{
			Host:       "0.0.0.0",
			Port:       PORT,
			Logger:     *CmdLogger,
			PrivateKey: PRIVATE_KEY,
			Api:        &api,
		})

		// Initializing cronhandler for cron tasks
		cronHandler := handlers.NewCronHandler(types.Credentials{
			InstanceId:       INSTANCE_ID,
			Host:             HOST,
			MachineSignature: MACHINE_SIGNATURE,
			AppDomain:        APP_DOMAIN,
			AppVersion:       APP_VERSION,
		}, CmdLogger)

		cronHandler.ScheduleAirgappedCronJobs(handlers.SchedulerOptions{
			ResyncFlagsInterval: int64(time.Hour),
		})

		// Creating a new instance of the worker to register cron
		worker := worker.NewPrimeWorker(CmdLogger)
		worker.RegisterJob("Prime Scheduler", cronHandler.Start)

		// Registering the Jobs to the cron handler
		worker.RegisterJob("Resync Instance Licenses", func(ctx context.Context) {
			err := handlers.UpdateFlagsHandler(ctx, api)
			if err != nil {
				CmdLogger.Error(ctx, err.Error())
			}
		})

		// Notify the channel on interrupt signals (Ctrl+C)
		go func() {
			signal := <-sigs
			log.Printf("Received signal: %v", signal)
			worker.Shutdown()
		}()

		worker.RegisterJob("Prime Monitor Router", httpHandler.StartHttpServer)
		// Starting the Jobs in background
		worker.StartJobsInBackground()
		worker.Wait()

		return nil
	},
}

func init() {
	rootCmd.AddCommand(StartAirgappedCmd)
}
