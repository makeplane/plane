package utils

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"math/big"
	"os"
	"plane/email/pkg/logger"
	"time"
)

func GenerateCerts() {
	// Create keys directory
	err := os.MkdirAll("keys", 0755)
	if err != nil {
		logger.Log.Errorf("failed to create keys directory: %v", err)
		return
	}

	// Check if keys already exist
	if keysExist() {
		logger.Log.Info("Keys and certificate already exist. Skipping generation.")
		return
	}

	// Generate self-signed certificate
	err = generateSelfSignedCert()
	if err != nil {
		logger.Log.Errorf("failed to generate self-signed certificate: %v", err)
		return
	}

	logger.Log.Info("Keys and certificate generated successfully.")
}

func keysExist() bool {
	files := []string{
		"keys/key.pem",
		"keys/cert.pem",
	}

	for _, file := range files {
		if _, err := os.Stat(file); os.IsNotExist(err) {
			return false
		}
	}
	return true
}

func generateSelfSignedCert() error {
	// Generate private key
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return err
	}

	// Save private key
	privateKeyBytes, err := x509.MarshalPKCS8PrivateKey(privateKey)
	if err != nil {
		return err
	}
	privatePEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: privateKeyBytes,
	})
	err = os.WriteFile("keys/key.pem", privatePEM, 0600)
	if err != nil {
		return err
	}

	// Save public key
	publicKeyDER, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		return err
	}
	publicKeyBase64 := base64.StdEncoding.EncodeToString(publicKeyDER)
	err = os.WriteFile("keys/key.pub", []byte(publicKeyBase64), 0644)
	if err != nil {
		return err
	}

	// Create certificate template
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Country:      []string{"US"},
			Province:     []string{"Delaware"},
			Organization: []string{"Plane Software Inc"},
			CommonName:   "plane.so",
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(1, 0, 0),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	// Create certificate
	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
	if err != nil {
		return err
	}

	// Save certificate
	certPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "CERTIFICATE",
		Bytes: derBytes,
	})
	err = os.WriteFile("keys/cert.pem", certPEM, 0644)
	if err != nil {
		return err
	}

	return nil
}
