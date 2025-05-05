package handlers

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/makeplane/plane-ee/monitor/lib/logger"
)

type PrimeScheduleHandler struct{}

var primeLogger = logger.NewHandler(nil)

func NewPrimeScheduleHandler() *PrimeScheduleHandler {
	return &PrimeScheduleHandler{}
}

func (h *PrimeScheduleHandler) PreRun(id uuid.UUID, job string) {
	primeLogger.Info(context.Background(), fmt.Sprintf("[SCHEDULER] Started Job with UUID %v, and name %v", id, job))
}

func (h *PrimeScheduleHandler) PostRunE(id uuid.UUID, job string, err error) {
	primeLogger.Info(context.Background(), fmt.Sprintf("[SCHEDULER] Job (%v, %v) finished with error %v", id, job, err))
}

func (h *PrimeScheduleHandler) PostRun(id uuid.UUID, job string) {
	primeLogger.Info(context.Background(), fmt.Sprintf("[SCHEDULER] Job (%v, %v) finished successful execution", id, job))
}
