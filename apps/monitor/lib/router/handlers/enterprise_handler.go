package handlers

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	router_helpers "github.com/makeplane/plane-ee/monitor/lib/router/helpers"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
	"gorm.io/gorm"
)

func GetEnterpriseLicenseActivateHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {
		// Get the data from the request and forward the request to the API
		var payload prime_api.EnterpriseLicenseActivatePayload

		// Validate the payload sent from the client
		if err := ctx.BodyParser(&payload); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for enterprise license activation",
			})
		}

		// Forward the payload to the API and get the response
		data, errorResponse := api.EnterpriseLicenseActivate(payload)

		// If there is an error, return the error
		if errorResponse != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":  errorResponse.Error,
				"status": false,
			})
		}

		license, err := router_helpers.ConvertEnterpriseActivationResponseToLicense(data)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to convert license data",
			})
		}

		// Use transaction for all database operations
		err = db.Db.Transaction(func(tx *gorm.DB) error {

			// Delete all user licenses first (due to foreign key constraints)
			userLicenseDeleteResult := tx.Where("1=1").Delete(&db.UserLicense{})
			if userLicenseDeleteResult.Error != nil {
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to delete existing user licenses",
				})
			}

			// Delete all flags first (due to foreign key constraints)
			flagsDeleteResult := tx.Where("1=1").Delete(&db.Flags{})
			if flagsDeleteResult.Error != nil {
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to delete existing flags",
				})
			}

			// Delete all licenses - using "1=1" to explicitly delete all records
			licenseDeleteResult := tx.Where("1=1").Delete(&db.License{})
			if licenseDeleteResult.Error != nil {
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to delete existing licenses",
				})
			}

			// Create the license for the workspace
			createResult := tx.Create(license)
			if createResult.Error != nil {
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to create license",
				})
			}

			if createResult.RowsAffected == 0 {
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "License creation succeeded but no rows were affected",
				})
			}

			// Verify the license was actually created within the transaction
			var createdLicense db.License
			findResult := tx.Where("id = ?", license.ID).First(&createdLicense)
			if findResult.Error != nil {
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "License was not found after creation",
				})
			}

			// Count total licenses after creation
			var finalCount int64
			tx.Model(&db.License{}).Count(&finalCount)

			// Create the members for the license
			members := make([]db.UserLicense, 0)
			for i, member := range data.MemberList {
				userUUID, err := uuid.Parse(member.UserId)
				if err != nil {
					fmt.Printf("ERROR: Invalid user UUID at index %d: %s, error: %v\n", i, member.UserId, err)
					continue // Skip invalid UUIDs
				}
				members = append(members, db.UserLicense{
					UserID:    userUUID,
					LicenseID: license.ID,
					Role:      member.UserRole,
					Synced:    true,
					IsActive:  member.IsActive,
				})
			}

			if len(members) > 0 {
				membersResult := tx.CreateInBatches(members, 100)
				if membersResult.Error != nil {
					fmt.Printf("ERROR: Failed to create members: %v\n", membersResult.Error)
					return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"error": "Failed to create members",
					})
				}
			} else {
				fmt.Printf("ERROR: No members to create\n")
			}

			flags, err := api.GetFeatureFlags(license.LicenseKey)

			if err != nil {
				ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": err.Error,
				})
				return fmt.Errorf("failed to get feature flags: %v", err)
			}

			flagData := &db.Flags{
				LicenseID:  license.ID,
				Version:    flags.Version,
				AesKey:     flags.EncyptedData.AesKey,
				Nonce:      flags.EncyptedData.Nonce,
				CipherText: flags.EncyptedData.CipherText,
				Tag:        flags.EncyptedData.Tag,
			}
			tx.Create(flagData)

			return nil // Transaction will commit if we return nil
		})

		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Transaction failed",
			})
		}
		// Send the workspace activation message back to the client
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Enterprise license activated successfully for the instance",
			"status":  true,
			"license": license,
		})
		return nil
	}
}

func GetEnterpriseLicenseManualSyncHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		license := &db.License{}

		// check if any enterprise license exists for the instance
		existingEnterpriseLicense := db.Db.Where("product_type = ?", "ENTERPRISE").First(&license)
		if existingEnterpriseLicense.Error != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "No enterprise license exists for the instance`",
			})
		}

		err := db.Db.Transaction(func(tx *gorm.DB) error {
			updatedLicense, activationReponse, err := router_helpers.RefreshEnterpriseLicense(context.Background(), api, license, tx)
			if err != nil {
				return err
			}

			if api.IsAirgapped() {
				return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
					"message": "Enterprise license synchronized successfully for the instance",
				})
			}

			if err := router_helpers.RefreshEnterpriseLicenseUsers(context.Background(), updatedLicense, *activationReponse, tx); err != nil {
				return err
			}

			if err := router_helpers.RefreshEnterpriseLicenseFeatureFlags(context.Background(), api, *updatedLicense, tx); err != nil {
				return err
			}

			return nil
		})
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to synchronize enterprise license for the instance",
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Enterprise license synchronized successfully for the instance",
			"status":  true,
			"license": license,
		})
	}
}

func DeactivateEnterpriseLicense(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {

		// Find the license associated with the worksapce id and workspace slug
		var license db.License
		record := db.Db.Model(&db.License{}).Where("product_type = ?", "ENTERPRISE").First(&license)

		if record.Error != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No license exist for corresponding workspace sent.",
			})
		}

		// Attempt to deactivate with Prime, log errors but always proceed with local cleanup
		fetchError := api.DeactivateEnterpriseLicense(prime_api.LicenseDeactivatePayload{
			LicenseKey: license.LicenseKey,
		})

		if fetchError != nil {
			fmt.Printf("ERROR: Failed to deactivate enterprise license with Prime: %s\n", fetchError.Error)
		}

		// Create a transaction for clearing the license, flags and license users
		err := db.Db.Transaction(func(tx *gorm.DB) error {
			// Clear flags and user licenses before deleting the license (foreign key constraints)
			tx.Where("license_id = ?", license.ID).Delete(&db.Flags{})
			tx.Where("license_id = ?", license.ID).Delete(&db.UserLicense{})
			tx.Delete(&license)
			return nil
		})

		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to deactivate enterprise license for the instance",
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "License deactivated successfully",
		})
	}
}

type UpdateEnterpriseLicenseSeatsPayload struct {
	Quantity int64 `json:"quantity"`
}

func UpdateEnterpriseLicenseSeats(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload UpdateEnterpriseLicenseSeatsPayload

		// Parse the incoming payload
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for license update",
			})
			return err
		}

		// Find the license associated with the worksapce id and workspace slug
		var license db.License
		record := db.Db.Model(&db.License{}).Where("product_type = ?", "ENTERPRISE").First(&license)

		if record.Error != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No license exist for corresponding workspace sent.",
			})
		}

		// Update prime with the quantity asked
		data, err := api.UpdateEnterpriseLicenseSeats(prime_api.UpdateEnterpriseLicenseSeatsPayload{
			Quantity:   payload.Quantity,
			LicenseKey: license.LicenseKey,
		})

		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error,
			})
		}

		// Update the license with the new data
		license.Seats = int(data.Seats)
		db.Db.Save(&license)

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"seats": license.Seats,
		})
	}
}

func GetEnterpriseLicensePortal(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		// Get the data from the request and forward the request to the API
		data, err := api.GetEnterpriseLicensePortal()
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error,
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Enterprise license portal",
			"data":    data,
		})
	}
}

func GetEnterpriseLicenseSync(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload prime_api.EnterpriseLicenseSyncPayload

		// Parse the incoming payload
		if err := ctx.BodyParser(&payload); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for enterprise license sync",
			})
		}

		license := &db.License{}
		record := db.Db.Model(&db.License{}).Where("product_type = ?", "ENTERPRISE").First(&license)

		// No license found, exit
		if record.Error != nil {
			return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "No enterprise license found for the instance",
				"status":  false,
			})
		}

		// Set the license key from the existing license
		payload.LicenceKey = license.LicenseKey

		// Sync with Prime
		data, err := api.SyncEnterpriseLicense(payload)

		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":  err.Error,
				"status": false,
			})
		}

		// Use transaction to update license, users, and flags
		txErr := db.Db.Transaction(func(tx *gorm.DB) error {
			// Refresh enterprise license from Prime response
			updatedLicense, err := router_helpers.RefreshEnterpriseLicenseFromResponse(license, data, tx)
			if err != nil {
				return err
			}
			license = updatedLicense

			// Refresh enterprise license users from Prime response
			if err := router_helpers.RefreshEnterpriseLicenseUsers(context.Background(), license, *data, tx); err != nil {
				return err
			}

			// Refresh enterprise license feature flags (skip for airgapped)
			if !api.IsAirgapped() {
				if err := router_helpers.RefreshEnterpriseLicenseFeatureFlags(context.Background(), api, *license, tx); err != nil {
					return err
				}
			}

			return nil
		})

		if txErr != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":  "Failed to sync enterprise license",
				"status": false,
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Enterprise license synced successfully",
			"status":  true,
			"license": license,
		})
	}
}

func GetEnterpriseLicenseProrationPreview(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload UpdateEnterpriseLicenseSeatsPayload

		// Parse the incoming payload
		if err := ctx.BodyParser(&payload); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for license update",
			})
		}

		var license db.License
		record := db.Db.Model(&db.License{}).Where("product_type = ?", "ENTERPRISE").First(&license)
		if record.Error != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No license exist for corresponding workspace sent.",
			})
		}

		// Get the data from the request and forward the request to the API
		data, err := api.GetEnterpriseLicenseProrationPreview(prime_api.UpdateEnterpriseLicenseSeatsPayload{
			Quantity:   payload.Quantity,
			LicenseKey: license.LicenseKey,
		})
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error,
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(data)
	}
}

func GetEnterpriseLicenseCurrentPlan(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		license := &db.License{}

		// check if any enterprise license exists for the instance
		existingEnterpriseLicense := db.Db.Where("product_type = ?", "ENTERPRISE").First(&license)
		if existingEnterpriseLicense.Error != nil {
			return ctx.Status(fiber.StatusOK).JSON(&fiber.Map{
				"id":                        uuid.New(),
				"product":                   "FREE",
				"purchased_seats":           0,
				"free_seats":                12,
				"current_period_start_date": nil,
				"current_period_end_date":   nil,
				"is_cancelled":              false,
				"interval":                  "MONTHLY",
				"is_offline_payment":        false,
				"trial_end_date":            nil,
				"has_added_payment_method":  false,
				"has_activated_free_trial":  false,
				"subscription":              "",
				"is_self_managed":           true,
				"remaining_trial_days":      0,
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(&fiber.Map{
			"id":                        license.ID,
			"product":                   license.ProductType,
			"purchased_seats":           license.Seats,
			"free_seats":                license.FreeSeats,
			"current_period_start_date": nil,
			"current_period_end_date":   license.CurrentPeriodEndDate,
			"is_cancelled":              license.IsCancelled,
			"interval":                  license.Interval,
			"is_offline_payment":        license.IsOfflinePayment,
			"trial_end_date":            license.TrialEndDate,
			"has_added_payment_method":  license.HasAddedPaymentMethod,
			"has_activated_free_trial":  license.HasActivatedFreeTrial,
			"subscription":              license.Subscription,
			"is_self_managed":           true,
			"remaining_trial_days":      0,
		})
	}
}
