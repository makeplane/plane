package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/makeplane/plane-ee/monitor/lib/feat_flag"
)

type FeatureFlagResponse struct {
	Flags FeatureFlagResult `json:"values"`
}

type FeatureFlagResult map[string]interface{}

func FeatureFlagHandler(ctx *fiber.Ctx) error {
	ff := feat_flag.FFProducer
	// Consume the features from the feature flag producer
	features := <-ff.Features
	// Check if there are parameters specified for the current feature flags
	features = features["values"].(map[string]interface{})

	response := FeatureFlagResponse{
		Flags: make(FeatureFlagResult),
	}

	// If the feature flag is specified, send only that feature flag
	if ctx.Query("feature") != "" {
		value, ok := features[ctx.Query("feature")]
		if !ok {
			ctx.Status(fiber.StatusBadRequest)
			return nil
		}
		response.Flags[ctx.Query("feature")] = value
		ctx.Status(200).JSON(response)
	} else {
		// Send all the feature flags recieved from the producer
		for feature, value := range features {
			response.Flags[feature] = value
		}
		ctx.Status(200).JSON(response)
	}

	return nil
}
