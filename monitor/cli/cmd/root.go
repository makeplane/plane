/*
Copyright © 2024 plane.so engineering@plane.so
*/
package cmd

import (
	"fmt"
	"os"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/makeplane/plane-ee/monitor/pkg/constants"
	"github.com/makeplane/plane-ee/monitor/pkg/constants/descriptors"
	error_msgs "github.com/makeplane/plane-ee/monitor/pkg/constants/errors"
	"github.com/spf13/cobra"
)

var CmdLogger = logger.NewHandler(nil)
var MACHINE_SIGNATURE = ""
var APP_DOMAIN = ""
var APP_VERSION = ""
var INSTANCE_ID = ""
var PORT = "8080"
var HOST = "https://prime.plane.so"
var PRIVATE_KEY = ``

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   descriptors.PRIME_MONITOR_USAGE,
	Short: descriptors.PRIME_MONITOR_USAGE_DESC,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		if host := os.Getenv(constants.PRIME_HOST); host != "" {
			HOST = host
		}

		if appDomain := os.Getenv(constants.APP_DOMAIN); appDomain == "" {
			return fmt.Errorf(error_msgs.APP_DOMAIN_ABSENT)
		} else {
			APP_DOMAIN = appDomain
		}

		if appVersion := os.Getenv(constants.APP_VERSION); appVersion == "" {
			return fmt.Errorf(error_msgs.APP_VERSION_ABSENT)
		} else {
			APP_VERSION = appVersion
		}

		if port := os.Getenv(constants.PORT); port != "" {
			PORT = port
		}

		if machineSignature := os.Getenv(constants.MACHINE_SIGNATURE); machineSignature == "" {
			return fmt.Errorf(error_msgs.MACHINE_SIG_ABSENT)
		} else {
			MACHINE_SIGNATURE = machineSignature
		}

		if instanceId := os.Getenv(constants.INSTANCE_ID); instanceId == "" {

			// If we don't get the instance id, we need to look up for the
			// DEPLOY_PLATFORM env, such that we can decide, if we the platform is not
			// docker compose then we need to create the instance on our own. As helm
			// and kubernetes can't provide the instance id.

			if deployPlatform := os.Getenv(constants.DEPLOY_PLATFORM); deployPlatform == "" {
				return fmt.Errorf(error_msgs.DEPLOY_PLATFORM_ABSENT)
			} else {
				api := prime_api.NewMonitorApi(HOST, MACHINE_SIGNATURE, "", APP_VERSION)
				setupResponse, err := api.InitializeInstance(prime_api.CredentialsPayload{
					ServerId:   MACHINE_SIGNATURE,
					Domain:     APP_DOMAIN,
					AppVersion: APP_VERSION,
				})

				if err != nil {
					return fmt.Errorf(error_msgs.FAILED_INITIALIZATION, APP_DOMAIN)
				}

				INSTANCE_ID = setupResponse.InstanceId
			}
		} else {
			INSTANCE_ID = instanceId
		}
		return nil
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute(privateKey string) {
	PRIVATE_KEY = privateKey
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}