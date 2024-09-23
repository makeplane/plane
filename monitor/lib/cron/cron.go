package prime_cron

import (
	"sync"

	"github.com/go-co-op/gocron/v2"
	"github.com/google/uuid"
)

type PrimeLifeCycleHandler interface {
	PreRun(uuid.UUID, string)
	PostRunE(uuid.UUID, string, error)
	PostRun(uuid.UUID, string)
}

type PrimeScheduler struct {
	Scheduler gocron.Scheduler
	Handler   PrimeLifeCycleHandler
}

func NewPrimeScheduler(handler PrimeLifeCycleHandler) (*PrimeScheduler, error) {
	// TODO: add a logger to scheduler
	scheduler, err := gocron.NewScheduler()
	if err != nil {
		return nil, err
	}
	return &PrimeScheduler{
		Scheduler: scheduler,
		Handler:   handler,
	}, nil
}

// Lists all the jobs for the current scheduler
func (p *PrimeScheduler) GetJobs() []gocron.Job {
	return p.Scheduler.Jobs()
}

// Create Job creates a new job for the PrimeScheduler
func (p *PrimeScheduler) RegisterJob(defination gocron.JobDefinition, task gocron.Task, options ...gocron.JobOption) (gocron.Job, error) {
	options = append(options, gocron.WithEventListeners(
		gocron.AfterJobRuns(p.Handler.PostRun),
		gocron.BeforeJobRuns(p.Handler.PreRun),
		gocron.AfterJobRunsWithError(p.Handler.PostRunE),
	))
	return p.Scheduler.NewJob(defination, task, options...)
}

// Add Job to the Prime Scheduler
func (p *PrimeScheduler) GetJobsWaiting() int {
	return p.Scheduler.JobsWaitingInQueue()
}

func (p *PrimeScheduler) Start() {
	p.Scheduler.Start()
}

func (p *PrimeScheduler) StartWithBlocker() {
	var wg = sync.WaitGroup{}
	wg.Add(1)
	p.Scheduler.Start()
	wg.Wait()
}

func (p *PrimeScheduler) Shutdown() error {
	return p.Scheduler.Shutdown()
}
