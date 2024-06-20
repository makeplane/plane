/*
Copyright © 2024 plane.so engineering@plane.so
*/
package cmd

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/go-co-op/gocron/v2"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	prime_cron "github.com/makeplane/plane-ee/monitor/lib/cron"
	"github.com/makeplane/plane-ee/monitor/lib/healthcheck"
	"github.com/makeplane/plane-ee/monitor/pkg/constants/descriptors"
	"github.com/makeplane/plane-ee/monitor/pkg/handlers"
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

		primeSchedulerHandler := handlers.NewPrimeScheduleHandler()
		primeScheduler, err := prime_cron.NewPrimeScheduler(primeSchedulerHandler)
		if err != nil {
			return err
		}
		primeScheduler.RegisterNewHealthCheckJob(
			context.Background(),
			gocron.DurationJob(time.Duration(healthCheckInterval)*time.Minute),
			func(statuses []*healthcheck.HealthCheckStatus, errors []*error) {
				if len(errors) != 0 {
					CmdLogger.Error(context.Background(), fmt.Sprintf("Health Check Job returned not nil error message (%v)", errors[0]))
					return
				}
				statusMap := map[string]string{}
				metaMap := map[string]prime_api.StatusMeta{}
				msg := ""

				for _, status := range statuses {
					normServiceName := "service_" + strings.ToLower(status.ServiceName)
					// If the service status is inside the ok status range
					if status.StatusCode >= 200 && status.StatusCode <= 227 {
						statusMap[normServiceName] = descriptors.HEALTHY
						msg = fmt.Sprintf("Recieved Service (%v) status code (%d)", status.ServiceName, status.StatusCode)
						CmdLogger.Info(context.Background(), msg)
					} else {
						statusMap[normServiceName] = descriptors.UNHEALTHY

						var code = prime_api.NotReachable
						var statusCode = status.StatusCode
						reachable := 1

						if status.Status == healthcheck.SERVICE_STATUS_REACHABLE {
							code = prime_api.ReachableWithNotOkStatus
							msg = fmt.Sprintf("Recieved Non Healthy Status Code (%d) from Service (%v), Unhealthy", status.StatusCode, status.ServiceName)
							CmdLogger.Error(context.Background(), msg)
						} else {
							code = prime_api.NotReachable
							reachable = 0
							msg = fmt.Sprintf("Recieved Non Healthy Status Code (%d) from Service (%v), Not Reachable", status.StatusCode, status.ServiceName)
							CmdLogger.Error(context.Background(), msg)
						}
						metaMap[normServiceName] = prime_api.StatusMeta{
							Message:    msg,
							Code:       code,
							StatusCode: statusCode,
							Reachable:  reachable,
						}
					}
				}

				monitorApi := prime_api.NewMonitorApi(HOST, LICENSE_KEY, LICENSE_VERSION, MACHINE_SIGNATURE)
				errorCode := monitorApi.PostServiceStatus(prime_api.StatusPayload{
					Status:  statusMap,
					Meta:    metaMap,
					Version: LICENSE_VERSION,
				})

				if errorCode != 0 {
					CmdLogger.Error(context.Background(), fmt.Sprintf("Recived Error while reporting health status, %v", errorCode))
				}
			},
		)
		primeScheduler.StartWithBlocker()
		return nil
	},
}

func init() {
	// interval is used as healthcheck for added consistency
	StartCmd.Flags().Int(descriptors.FLAG_INTERVAL_HEALTHCHECK, 5, descriptors.FLAG_INTERVAL_HEALTHCHECK_USE)
	rootCmd.AddCommand(StartCmd)
}
