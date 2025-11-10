package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Config holds RabbitMQ connection configuration
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	VHost    string
	Exchange string
}

// getConfig loads configuration from environment variables
func getConfig() *Config {
	return &Config{
		Host:     getEnv("RABBITMQ_HOST", "localhost"),
		Port:     getEnv("RABBITMQ_PORT", "5672"),
		User:     getEnv("RABBITMQ_USER", "guest"),
		Password: getEnv("RABBITMQ_PASSWORD", "guest"),
		VHost:    getEnv("RABBITMQ_VHOST", "/"),
		Exchange: getEnv("WEBHOOK_EXCHANGE", "event_stream"),
	}
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// connectRabbitMQ establishes a connection to RabbitMQ
func connectRabbitMQ(config *Config) (*amqp.Connection, error) {
	amqpURL := fmt.Sprintf("amqp://%s:%s@%s:%s%s",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.VHost,
	)

	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	log.Printf("Successfully connected to RabbitMQ at %s:%s", config.Host, config.Port)
	return conn, nil
}

// processMessage handles incoming messages from RabbitMQ
func processMessage(delivery amqp.Delivery) {
	log.Printf("Received message: %s", string(delivery.Body))

	// Try to parse as JSON for better logging
	var msg map[string]interface{}
	if err := json.Unmarshal(delivery.Body, &msg); err == nil {
		log.Printf("Message parsed as JSON: %+v", msg)
	}

	// TODO: Add your webhook processing logic here
	// For example:
	// - Parse the webhook event
	// - Send HTTP request to webhook URL
	// - Handle retries and error logging

	// Acknowledge the message
	if err := delivery.Ack(false); err != nil {
		log.Printf("Error acknowledging message: %v", err)
	} else {
		log.Printf("Message acknowledged successfully")
	}
}

// consumeMessages starts consuming messages from the queue
func consumeMessages(ch *amqp.Channel, queue amqp.Queue) error {
	msgs, err := ch.Consume(
		queue.Name, // queue
		"",         // consumer tag (empty = auto-generated)
		false,      // auto-ack (set to false for manual acknowledgment)
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	log.Printf("Waiting for messages. To exit press CTRL+C")

	// Process messages in a goroutine
	go func() {
		for delivery := range msgs {
			processMessage(delivery)
		}
	}()

	return nil
}

// handleShutdown gracefully shuts down the consumer
func handleShutdown(conn *amqp.Connection, ch *amqp.Channel) {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	log.Println("Shutting down gracefully...")

	if ch != nil {
		ch.Close()
	}
	if conn != nil {
		conn.Close()
	}

	log.Println("Shutdown complete")
	os.Exit(0)
}

func main() {
	log.Println("Starting RabbitMQ webhook consumer...")

	// Load configuration
	config := getConfig()
	log.Printf("Configuration loaded: Exchange=%s, Host=%s:%s", config.Exchange, config.Host, config.Port)

	// Connect to RabbitMQ
	conn, err := connectRabbitMQ(config)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	// Create a channel
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open channel: %v", err)
	}
	defer ch.Close()

	// Start consuming messages
	if err := consumeMessages(ch, queue); err != nil {
		log.Fatalf("Failed to start consuming messages: %v", err)
	}

	// Handle graceful shutdown
	handleShutdown(conn, ch)
}

