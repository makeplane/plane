package handlers

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/lib/feat_flag"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
)

func GetFeatureFlagHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload prime_api.GetFlagsPayload
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload",
			})
			return err
		}

		/*
			1. If slug, user_id and feature_key are provided, get the feature flag value for the user
			2. If slug, user_id are provided, get all the feature flags for the user in the workspace
			3. If slug and feature_key are provided, get the feature flag value for the workspace
			4. If only slug is provided, get all the feature flags for the workspace
		*/
		switch {
		case payload.WorkspaceSlug != "" && payload.UserID != "" && payload.FeatureKey != "":
			return handleUserFeatureFlag(ctx, payload, key)
		case payload.WorkspaceSlug != "" && payload.UserID != "":
			return handleUserAllFeatureFlags(ctx, payload, key)
		case payload.WorkspaceSlug != "" && payload.FeatureKey != "":
			return handleWorkspaceFeatureFlag(ctx, payload, key)
		case payload.WorkspaceSlug != "":
			return handleWorkspaceAllFeatureFlags(ctx, payload, key)
		default:
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request parameters",
			})
			return nil
		}
	}
}

func handleUserFeatureFlag(ctx *fiber.Ctx, payload prime_api.GetFlagsPayload, key string) error {
	var license db.License
	record := db.Db.Model(&db.License{}).Where("workspace_slug = ?", payload.WorkspaceSlug).First(&license)
	if record.Error != nil {
		fmt.Println("Error fetching license", record.Error)
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}
	// Existing logic for getting feature flag value for the user
	var userLicense db.UserLicense
	record = db.Db.Model(&db.UserLicense{}).Where("user_id = ? AND license_id = ?", payload.UserID, license.ID).First(&userLicense)
	if record.Error != nil {
		fmt.Println("Error fetching user license", record.Error)
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	if !userLicense.IsActive {
		ctx.JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	if license.ProductType == "FREE" {
		ctx.JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	// Taking precondition that APP_VERSION will be verfied at the time of startup
	APP_VERSION := os.Getenv("APP_VERSION")

	var flags db.Flags
	record = db.Db.Model(&db.Flags{}).Where("license_id = ? AND version = ?", license.ID, APP_VERSION).First(&flags)
	if record.Error != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	var decryptedFlags map[string]interface{}
	err := feat_flag.GetDecryptedJson(key, feat_flag.EncryptedData{
		CipherText: flags.CipherText,
		AesKey:     flags.AesKey,
		Nonce:      flags.Nonce,
		Tag:        flags.Tag,
	}, &decryptedFlags)
	if err != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	flagValue, ok := decryptedFlags[payload.FeatureKey]
	if !ok {
		ctx.JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	ctx.JSON(fiber.Map{
		"values": map[string]interface{}{
			payload.FeatureKey: flagValue,
		},
	})
	return nil
}

func handleUserAllFeatureFlags(ctx *fiber.Ctx, payload prime_api.GetFlagsPayload, key string) error {
	var license db.License
	record := db.Db.Model(&db.License{}).Where("workspace_slug = ?", payload.WorkspaceSlug).First(&license)
	if record.Error != nil {
		fmt.Println("Error fetching license", record.Error)
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	var userLicense db.UserLicense
	record = db.Db.Model(&db.UserLicense{}).Where("user_id = ? AND license_id = ?", payload.UserID, license.ID).First(&userLicense)
	if record.Error != nil {
		fmt.Println("Error fetching user license", record.Error)
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	if !userLicense.IsActive {
		fmt.Println("User is not active")
		ctx.JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	if license.ProductType == "FREE" {
		fmt.Println("Product type is free")
		ctx.JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	APP_VERSION := os.Getenv("APP_VERSION")

	var flags db.Flags
	record = db.Db.Model(&db.Flags{}).Where("license_id = ? AND version = ?", license.ID, APP_VERSION).First(&flags)
	if record.Error != nil {
		fmt.Println("Error fetching flags", record.Error)
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	var decryptedFlags map[string]interface{}
	err := feat_flag.GetDecryptedJson(key, feat_flag.EncryptedData{
		CipherText: flags.CipherText,
		AesKey:     flags.AesKey,
		Nonce:      flags.Nonce,
		Tag:        flags.Tag,
	}, &decryptedFlags)
	if err != nil {
		fmt.Println("Error decrypting flags", err)
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	ctx.JSON(fiber.Map{
		"values": decryptedFlags,
	})
	return nil
}

func handleWorkspaceFeatureFlag(ctx *fiber.Ctx, payload prime_api.GetFlagsPayload, key string) error {
	var license db.License
	record := db.Db.Model(&db.License{}).Where("workspace_slug = ?", payload.WorkspaceSlug).First(&license)
	if record.Error != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	APP_VERSION := os.Getenv("APP_VERSION")

	var flags db.Flags
	record = db.Db.Model(&db.Flags{}).Where("license_id = ? AND version = ?", license.ID, APP_VERSION).First(&flags)
	if record.Error != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	var decryptedFlags map[string]interface{}
	err := feat_flag.GetDecryptedJson(key, feat_flag.EncryptedData{
		CipherText: flags.CipherText,
		AesKey:     flags.AesKey,
		Nonce:      flags.Nonce,
		Tag:        flags.Tag,
	}, &decryptedFlags)
	if err != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	flagValue, ok := decryptedFlags[payload.FeatureKey]
	if !ok {
		ctx.JSON(fiber.Map{
			"values": map[string]bool{
				payload.FeatureKey: false,
			},
		})
		return nil
	}

	ctx.JSON(fiber.Map{
		"values": map[string]interface{}{
			payload.FeatureKey: flagValue,
		},
	})
	return nil
}

func handleWorkspaceAllFeatureFlags(ctx *fiber.Ctx, payload prime_api.GetFlagsPayload, key string) error {
	var license db.License
	record := db.Db.Model(&db.License{}).Where("workspace_slug = ?", payload.WorkspaceSlug).First(&license)
	if record.Error != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	APP_VERSION := os.Getenv("APP_VERSION")

	var flags db.Flags
	record = db.Db.Model(&db.Flags{}).Where("license_id = ? AND version = ?", license.ID, APP_VERSION).First(&flags)
	if record.Error != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	var decryptedFlags map[string]interface{}
	err := feat_flag.GetDecryptedJson(key, feat_flag.EncryptedData{
		CipherText: flags.CipherText,
		AesKey:     flags.AesKey,
		Nonce:      flags.Nonce,
		Tag:        flags.Tag,
	}, &decryptedFlags)
	if err != nil {
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]interface{}{},
		})
		return nil
	}

	ctx.JSON(fiber.Map{
		"values": decryptedFlags,
	})
	return nil
}
