package feat_flag

import (
	"context"
	"fmt"
	"time"
)

/* ------------------------ Singleton for Feature Flags ------------------------ */

type Flags struct {
	// A channel to send the feature flags to the handler
	Features    chan map[string]interface{}
	RefreshFlag chan bool
}

type EncryptedData struct {
	AesKey     string `json:"aes_key"`
	Nonce      string `json:"nonce"`
	CipherText string `json:"ciphertext"`
	Tag        string `json:"tag"`
}

type FlagsOptions struct {
	FlagRefeshInterval      time.Duration
	FlagRetryInterval       time.Duration
	FallbackRetryInterval   time.Duration
	EncryptedFlagDataGetter func() EncryptedData
	PrivateKey              string
}

var FFProducer *Flags

// Initiated a global variable for flags that continuously updates the flags,
// which can be consumed from Features channel of FFProducer
func IntantiateFlags(ctx context.Context, options FlagsOptions) *Flags {
	// The feature channel, that would work as a future to recieve the flag
	// updates
	if FFProducer == nil {
		features := make(chan map[string]interface{})
		refreshFlagSignal := make(chan bool)
		// Keep refreshing the flags in the background
		go refreshFlags(ctx, features, options, refreshFlagSignal)

		FFProducer = &Flags{
			Features:    features,
			RefreshFlag: refreshFlagSignal,
		}
	}

	return FFProducer
}

func refreshFlags(ctx context.Context, consumer chan<- map[string]interface{}, options FlagsOptions, refreshFlagSignal chan bool) {
	flags := make(map[string]interface{})
	retryInterval := options.FlagRetryInterval
	maxRetries := 5
	currentInterval := options.FlagRefeshInterval

	// Initial flag retrieval with retry logic
	err := retry(maxRetries, retryInterval, func() error {
		return GetDecryptedJson(options.PrivateKey, options.EncryptedFlagDataGetter(), &flags)
	})

	if err != nil {
		currentInterval = 1 * time.Hour
	}

	timeout := time.After(currentInterval)

	for {
		select {
		case <-ctx.Done():
			return
		case <-timeout:
			// Refresh the flags with retry logic
			err := retry(maxRetries, retryInterval, func() error {
				return GetDecryptedJson(options.PrivateKey, options.EncryptedFlagDataGetter(), &flags)
			})

			if err == nil {
				currentInterval = options.FlagRefeshInterval
			} else {
				currentInterval = 1 * time.Hour
			}

			timeout = time.After(currentInterval)
		case <-refreshFlagSignal:
			// Refresh the flags with retry logic
			err := retry(maxRetries, retryInterval, func() error {
				return GetDecryptedJson(options.PrivateKey, options.EncryptedFlagDataGetter(), &flags)
			})
			if err == nil {
				currentInterval = options.FlagRefeshInterval
			} else {
				currentInterval = 1 * time.Hour
			}
			timeout = time.After(currentInterval)
		case consumer <- flags:
		}
	}
}

func retry(attempts int, sleep time.Duration, f func() error) error {
	var err error
	for i := 0; i < attempts; i++ {
		if i > 0 {
			time.Sleep(sleep)
			sleep *= 2
		}
		err = f()
		if err == nil {
			return nil
		}
	}
	return fmt.Errorf("after %d attempts, last error: %s", attempts, err)
}
