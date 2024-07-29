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
var LICENSE_KEY = ""
var MACHINE_SIGNATURE = ""
var LICENSE_VERSION = ""
var HOST = "https://prime.plane.so"

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   descriptors.PRIME_MONITOR_USAGE,
	Short: descriptors.PRIME_MONITOR_USAGE_DESC,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		if host := os.Getenv(constants.PRIME_HOST); host != "" {
			HOST = host
		}

		if licenseKey := os.Getenv(constants.LICENSE_KEY); licenseKey == "" {
			return fmt.Errorf(error_msgs.LICENSE_ABSENT)
		} else {
			LICENSE_KEY = licenseKey
		}

		if licenseVersion := os.Getenv(constants.LICENSE_VERSION); licenseVersion == "" {
			return fmt.Errorf(error_msgs.LICENSE_VERSION_ABSENT)
		} else {
			LICENSE_VERSION = licenseVersion
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
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
