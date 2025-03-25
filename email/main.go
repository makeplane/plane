package main

import (
	"crypto/tls"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"plane/email/pkg/services"
	"plane/email/pkg/utils"

	"github.com/emersion/go-smtp"
)

func createServer(be *services.Backend, addr string, forceTLS bool) *smtp.Server {
	s := smtp.NewServer(be)
	s.Addr = addr
	s.Domain = os.Getenv("SMTP_DOMAIN")
	if s.Domain == "" {
		s.Domain = "localhost"
	}

	s.ReadTimeout = 60 * time.Second
	s.WriteTimeout = 60 * time.Second
	s.MaxMessageBytes = 1024 * 1024
	s.MaxRecipients = 50
	s.AllowInsecureAuth = !forceTLS
	s.EnableREQUIRETLS = forceTLS
	s.EnableBINARYMIME = true
	s.EnableSMTPUTF8 = true

	smtpDebug := strings.ToLower(os.Getenv("SMTP_DEBUG"))
	if smtpDebug == "true" || smtpDebug == "1" {
		s.Debug = utils.DebugWriter{}
	}
	s.ErrorLog = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)

	return s
}

func main() {

	// Generate Certificates
	utils.GenerateCerts()

	be := &services.Backend{}

	// Load TLS certificate
	certFilePath := os.Getenv("TLS_CERT_PATH")
	if certFilePath == "" {
		certFilePath = "keys/cert.pem"
	}

	keyFilePath := os.Getenv("TLS_PRIV_KEY_PATH")
	if keyFilePath == "" {
		keyFilePath = "keys/key.pem"
	}

	cert, err := tls.LoadX509KeyPair(certFilePath, keyFilePath)
	if err != nil {
		log.Fatal(err)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
		MaxVersion:   tls.VersionTLS13,
		ClientAuth:   tls.NoClientCert,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
		},
	}

	// Create server for port 25 (SMTP with optional STARTTLS)
	server25 := createServer(be, ":10025", false)
	server25.TLSConfig = tlsConfig

	// Create server for port 465 (SMTPS)
	server465 := createServer(be, ":10465", true)
	server465.TLSConfig = tlsConfig

	// Create server for port 587 (SMTP with STARTTLS)
	server587 := createServer(be, ":10587", false)
	server587.TLSConfig = tlsConfig

	// Use a WaitGroup to manage all servers
	var wg sync.WaitGroup
	wg.Add(3)

	// Start server on port 25
	go func() {
		defer wg.Done()
		log.Println("Starting SMTP server at", server25.Domain, server25.Addr)
		if err := server25.ListenAndServe(); err != nil {
			log.Printf("SMTP server (port 10025) error: %v", err)
		}
	}()

	// Start server on port 465
	go func() {
		defer wg.Done()
		log.Println("Starting SMTPS server at", server465.Domain, server465.Addr)
		if err := server465.ListenAndServeTLS(); err != nil {
			log.Printf("SMTPS server (port 10465) error: %v", err)
		}
	}()

	// Start server on port 587
	go func() {
		defer wg.Done()
		log.Println("Starting SMTP server at", server587.Domain, server587.Addr)
		if err := server587.ListenAndServe(); err != nil {
			log.Printf("SMTP server (port 10587) error: %v", err)
		}
	}()

	// Wait for all servers to finish
	wg.Wait()
}
