package prime_api

import "math/rand"

func generateRandomLicenseKey() string {
	const (
		charset = "0123456789abcdef"
		length  = 4
	)

	// Create a byte slice to store the key
	key := make([]byte, 14) // 12 chars + 2 hyphens

	// Generate random bytes for each group
	for i := 0; i < 3; i++ {
		for j := 0; j < length; j++ {
			key[i*5+j] = charset[rand.Intn(len(charset))]
		}
		if i < 2 {
			key[i*5+length] = '-'
		}
	}

	return string(key)
}
