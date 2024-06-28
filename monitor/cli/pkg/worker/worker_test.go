package worker

import (
	"context"
	"slices"
	"testing"
	"time"

	"github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/stretchr/testify/assert"
)

func TestPrimeWorker(t *testing.T) {
	log := logger.NewHandler(nil)
	worker := NewPrimeWorker(log)

	// Test RegisterJob
	job := func(ctx context.Context) {
		time.Sleep(2 * time.Second)
	}

	worker.RegisterJob("job1", job)
	worker.RegisterJob("job2", job)

	assert.Equal(t, 2, worker.GetJobCount())

	// Test StartJobsInBackground
	worker.StartJobsInBackground()
	// Running again to check the running status
	worker.StartJobsInBackground()
	time.Sleep(4 * time.Second) // Wait for the job to complete
	assert.Equal(t, 0, worker.GetJobCount())

	completedJobs := worker.GetCompletedJobs()
	assert.True(t, slices.Contains(completedJobs, "job1"))
	assert.True(t, slices.Contains(completedJobs, "job2"))

	// Test Shutdown
	worker.RegisterJob("job3", job)
	worker.StartJobsInBackground()
	time.Sleep(1 * time.Second) // Let the job start

	worker.Shutdown()
	assert.Equal(t, 0, worker.GetJobCount())
	assert.Contains(t, worker.GetCompletedJobs(), "job2")
}
