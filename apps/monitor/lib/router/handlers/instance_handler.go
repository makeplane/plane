package handlers

import (
	"github.com/gofiber/fiber/v2"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
)

func GetInstanceLicenses(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		// Initialize the variables
		var oidc_saml_auth bool

		// Check if the product type is PRO or ONE on any of the licenses
		record := db.Db.Model(&db.License{}).
			Where("product_type IN ?", []string{"PRO", "ONE", "BUSINESS", "ENTERPRISE"}).Select("1").Limit(1).Find(&oidc_saml_auth)

		// If there is an error, return false
		if record.Error != nil {
			oidc_saml_auth = false
		}

		// Check if the product type is ENTERPRISE on any of the licenses
		var hasEnterprise bool
		record = db.Db.Model(&db.License{}).
			Where("product_type IN ?", []string{"ENTERPRISE"}).Select("1").Limit(1).Find(&hasEnterprise)

		// If there is an error, return false
		if record.Error != nil {
			hasEnterprise = false
		}

		// Return the values
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": map[string]bool{
				"OIDC_SAML_AUTH": oidc_saml_auth,
				"LDAP_AUTH":      hasEnterprise,
			},
		})
		return nil
	}
}
