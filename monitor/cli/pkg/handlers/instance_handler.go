package handlers

import (
	"fmt"

	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
)

type InstanceHandler struct {
	api prime_api.IPrimeMonitorApi
}

func NewInstanceHandler(api prime_api.IPrimeMonitorApi) *InstanceHandler {
	return &InstanceHandler{api: api}
}

func (h *InstanceHandler) Activate() error {
	err := h.api.ActivateInstance()
	if err != 0 {
		return fmt.Errorf("unable to activate instance: %s", err)
	}

	return nil
}

func (h *InstanceHandler) Deactivate() error {
	err := h.api.DeactivateInstance()
	if err != 0 {
		return fmt.Errorf("unable to deactivate instance: %s", err)
	}

	return nil
}
