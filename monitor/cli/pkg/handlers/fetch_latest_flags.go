package handlers

import (
	"context"
	"fmt"
	"sync"

	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
)

// Fetches all the licenses from the database and updates the flags
func UpdateFlagsHandler(ctx context.Context, api prime_api.IPrimeMonitorApi) error {
	var licenses []db.License
	if err := db.Db.Find(&licenses).Error; err != nil {
		return err
	}

	var wg sync.WaitGroup

	for _, license := range licenses {
		wg.Add(1)
		go func(license db.License) error {
			defer wg.Done()
			flags, err := api.GetFeatureFlags(license.LicenseKey)
			if err != 0 {
				fmt.Println("Failed to fetch flags for license", license.LicenseKey)
			}

			flagData := db.Flags{
				LicenseID:  license.ID,
				Version:    flags.Version,
				AesKey:     flags.EncyptedData.AesKey,
				Nonce:      flags.EncyptedData.Nonce,
				CipherText: flags.EncyptedData.CipherText,
				Tag:        flags.EncyptedData.Tag,
			}

			if err := db.Db.Where("license_id = ?", license.ID).Delete(&db.Flags{}).Error; err != nil {
				return err
			}

			if err := db.Db.Create(&flagData).Error; err != nil {
				return err
			}
			return nil
		}(license)
	}

	wg.Wait()
	return nil
}
