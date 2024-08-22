package feat_flag

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"

	"github.com/youmark/pkcs8"
)

// File exports utility functions for decrypting feature flags, requiring the
// private key to be passed in as a parameter.

/* ------------------------ Controller Methods ------------------------------- */
// Takes in the private key and returns the decrypted feature flags
func GetDecryptedJson(privateKeyBytes []byte, encryptedFeatureFlag EncryptedData, out interface{}) error {
	// Parse the private key
	rsaPrivateKey, err := parsePrivateKey(privateKeyBytes)
	if err != nil {
		return fmt.Errorf("failed to parse private key: %v", err)
	}

	// Decrypt the feature flag
	decryptedData, err := decryptWithPrivateKey(encryptedFeatureFlag, rsaPrivateKey)
	if err != nil {
		return fmt.Errorf("failed to decrypt feature flag: %v", err)
	}

	// Return the error from the unmarshal function
	return json.Unmarshal(decryptedData, out)
}

/* ---------------------- Helper Functions ---------------------------- */
// Parses the private key given to the rsa.PrivateKey type
func parsePrivateKey(pemEncodedKey []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemEncodedKey)
	if block == nil {
		return nil, fmt.Errorf("failed to parse PEM block containing the key")
	}

	privateKey, err := pkcs8.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse RSA private key: %v", err)
	}

	key := privateKey.(*rsa.PrivateKey)

	return key, nil
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
