package feat_flag

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"os"
	"strings"

	"github.com/youmark/pkcs8"
)

// File exports utility functions for decrypting feature flags, requiring the
// private key to be passed in as a parameter.

/* ------------------------ Controller Methods ------------------------------- */
// Takes in the private key and returns the decrypted feature flags
func GetDecryptedJson(base64EncodedKey string, encryptedFeatureFlag EncryptedData, out interface{}) error {
	// Parse the private key
	rsaPrivateKey, err := ParsePrivateKey(base64EncodedKey)
	if err != nil {
		return fmt.Errorf("failed to parse private key: %v", err)
	}

	// decrypt with the pem key

	// Decrypt the feature flag
	decryptedData, err := decryptWithPrivateKey(encryptedFeatureFlag, rsaPrivateKey)
	if err != nil {
		fmt.Printf("failed to decrypt feature flag: %v", err)
		os.Exit(1)
	}

	// Return the error from the unmarshal function
	return json.Unmarshal(decryptedData, out)
}

func decodeBase64Key(base64EncodedKey string) ([]byte, error) {
	// Remove any whitespace from the encoded key
	base64EncodedKey = strings.TrimSpace(base64EncodedKey)

	// Remove any line breaks or spaces within the string
	base64EncodedKey = strings.ReplaceAll(base64EncodedKey, "\n", "")
	base64EncodedKey = strings.ReplaceAll(base64EncodedKey, "\r", "")
	base64EncodedKey = strings.ReplaceAll(base64EncodedKey, " ", "")

	// Check if the length of the string is a multiple of 4, if not, pad with '='
	if len(base64EncodedKey)%4 != 0 {
		padding := 4 - (len(base64EncodedKey) % 4)
		base64EncodedKey += strings.Repeat("=", padding)
	}

	// Try standard base64 decoding
	decodedKey, err := base64.StdEncoding.DecodeString(base64EncodedKey)
	if err == nil {
		return decodedKey, nil
	}

	// If both methods fail, return an error
	return nil, fmt.Errorf("failed to decode base64 key: %v", err)
}

/* ---------------------- Helper Functions ---------------------------- */
// Parses the private key given to the rsa.PrivateKey type

func ParsePrivateKey(base64EncodedKey string) (*rsa.PrivateKey, error) {
	decodedKey, err := decodeBase64Key(base64EncodedKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 key: %v", err)
	}

	block, _ := pem.Decode(decodedKey)
	if block == nil {
		return nil, fmt.Errorf("failed to parse PEM block containing the key")
	}
	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)

	if err != nil {
		privateKey, err := pkcs8.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse RSA private key: %v", err)
		}

		key := privateKey.(*rsa.PrivateKey)
		return key, nil
	}

	return privateKey, nil
}

func decryptWithPrivateKey(data EncryptedData, privateKey *rsa.PrivateKey) ([]byte, error) {
	// Decode the base64 encoded AES key
	aesKey, err := base64.StdEncoding.DecodeString(data.AesKey)
	if err != nil {
		fmt.Printf("Error decoding AES key: %v\n", err)
		return nil, err
	}

	nonce, err := base64.StdEncoding.DecodeString(data.Nonce)
	if err != nil {
		fmt.Printf("Error decoding nonce: %v\n", err)
		return nil, err
	}

	ciphertext, err := base64.StdEncoding.DecodeString(data.CipherText)
	if err != nil {
		fmt.Printf("Error decoding ciphertext: %v\n", err)
		return nil, err
	}

	tag, err := base64.StdEncoding.DecodeString(data.Tag)
	if err != nil {
		fmt.Printf("Error decoding tag: %v\n", err)
		return nil, err
	}

	decryptedAESKey, err := rsa.DecryptOAEP(sha1.New(), rand.Reader, privateKey, aesKey, nil)
	if err != nil {
		fmt.Printf("Error decrypting AES key: %v\n", err)
		return nil, err
	}

	blockCipher, err := aes.NewCipher(decryptedAESKey)
	if err != nil {
		fmt.Printf("Error creating AES cipher: %v\n", err)
		return nil, err
	}

	aesGCM, err := cipher.NewGCMWithNonceSize(blockCipher, 16)
	if err != nil {
		fmt.Printf("Error creating GCM: %v\n", err)
		return nil, err
	}

	plaintext, err := aesGCM.Open(nil, nonce, append(ciphertext, tag...), nil)
	if err != nil {
		fmt.Printf("Error decrypting ciphertext: %v\n", err)
		return nil, err
	}

	return plaintext, nil
}
