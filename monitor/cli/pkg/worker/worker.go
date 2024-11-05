package worker

import (
	"context"
	"fmt"
	"sync"

	log "github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/makeplane/plane-ee/monitor/pkg/constants/descriptors"
	error_msgs "github.com/makeplane/plane-ee/monitor/pkg/constants/errors"
)

type Job func(context.Context)

type JobDefination struct {
	Id  string
	Job Job
}

// Prime Worker is responsible to run jobs in the background and keeping in
// track of each of them
type PrimeWorker struct {
	sync.Mutex
	ctx        context.Context
	cancel     context.CancelFunc
	wg         *sync.WaitGroup
	jobs       []JobDefination
	Logger     *log.Handler
	ExitedJobs []string
	running    bool
}

func NewPrimeWorker(logger *log.Handler) *PrimeWorker {
	ctx, cancel := context.WithCancel(context.Background())

	return &PrimeWorker{
		wg:      &sync.WaitGroup{},
		ctx:     ctx,
		cancel:  cancel,
		jobs:    make([]JobDefination, 0),
		Logger:  logger,
		running: false,
	}
}

// ---------------- Controller Methods -----------------------
// Adds a new job the job queue with an identifier
func (w *PrimeWorker) RegisterJob(id string, job Job) {
	w.wg.Add(1)
	w.jobs = append(w.jobs, JobDefination{
		Id:  id,
		Job: job,
	})
}

// Returns the currently available jobs
func (w *PrimeWorker) GetJobCount() int {
	return len(w.jobs)
}

func (w *PrimeWorker) GetCompletedJobs() []string {
	return w.ExitedJobs
}

// Starts the jobs in background and updates the completed and errored jobs
// queue for the updates
func (w *PrimeWorker) StartJobsInBackground() {
	if w.running {
		w.Logger.Error(context.Background(), fmt.Sprintf(error_msgs.F_WORKER_ALREADY_RUNNING, w.GetJobCount(), len(w.GetCompletedJobs())))
		return
	}
	w.running = true
	for _, job := range w.jobs { // Running the job in background
		go func(w *PrimeWorker, job JobDefination) {
			// Modify the job queue and append the completed job to the completion
			// array when the job is done
			defer func(w *PrimeWorker, job JobDefination) {
				w.DequeueJob(job)
			}(w, job)

			// Start the job in the background with a boolean channel for messages
			done := make(chan bool)
			go func() {
				defer close(done)
				w.Logger.Info(w.ctx, fmt.Sprintf(descriptors.F_START_JOB, job.Id))
				job.Job(w.ctx)
				done <- true
			}()

			// Listen for the cancellation signal for cancellation of the job
			select {
			case <-w.ctx.Done():
				w.Logger.Warning(w.ctx, fmt.Sprintf(descriptors.F_SHUTTING_DOWN_JOB, job.Id))
				return
			case <-done:
				w.Logger.Info(w.ctx, fmt.Sprintf(descriptors.F_EXITED_JOB, job.Id))
				return
			}
		}(w, job)
	}
}

func (w *PrimeWorker) Shutdown() {
	w.Logger.Warning(w.ctx, descriptors.SHUTTING_DOWN)
	w.cancel()
	w.wg.Wait()
}

func (w *PrimeWorker) Wait() {
	w.wg.Wait()
}

func (w *PrimeWorker) DequeueJob(job JobDefination) {
	jobIndex := 0
	// Find the position of the job in the job queue
	for index, j := range w.jobs {
		if j.Id == job.Id {
			jobIndex = index
		}
	}

	w.Lock()
	w.wg.Done()
	// Pop off the job from the job queue
	if jobIndex == len(w.jobs)-1 {
		w.jobs = w.jobs[:jobIndex]
	} else {
		w.jobs[jobIndex] = w.jobs[len(w.jobs)-1]
		w.jobs = w.jobs[:len(w.jobs)-1]
	}

	// Append the finished job to the exited job slice
	w.ExitedJobs = append(w.ExitedJobs, job.Id)

	if w.GetJobCount() == 0 {
		w.running = false
	}
	w.Unlock()
}
