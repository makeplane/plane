/*
Copyright © 2024 plane.so engineering@plane.so
*/
package cmd

import (
	"fmt"
	"os"

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

		if instanceId := os.Getenv(constants.INSTANCE_ID); instanceId == "" {
			return fmt.Errorf(error_msgs.INSTANCE_ID_ABSENT)
		} else {
			INSTANCE_ID = instanceId
		}

		if machineSignature := os.Getenv(constants.MACHINE_SIGNATURE); machineSignature == "" {
			return fmt.Errorf(error_msgs.MACHINE_SIG_ABSENT)
		} else {
			MACHINE_SIGNATURE = machineSignature
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
