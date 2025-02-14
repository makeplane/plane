package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type EmailData struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func SaveEmail(from, to, subject, body string) error {
	// Do the API call to POST the email content
	EMAIL_SAVE_ENDPOINT := os.Getenv("EMAIL_SAVE_ENDPOINT")

	if EMAIL_SAVE_ENDPOINT == "" {
		filename := fmt.Sprintf("emails/%d.eml", time.Now().UnixNano())
		content := fmt.Sprintf("From: %s\nTo: %s\nSubject: %s\n\n%s", from, to, subject, body)
		return os.WriteFile(filename, []byte(content), 0644)
	} else {
		response, err := postRequest(EMAIL_SAVE_ENDPOINT, EmailData{
			From:    from,
			To:      to,
			Subject: subject,
			Body:    body,
		})
		if err != nil {
			return fmt.Errorf("error saving email: %v", err)
		}
		fmt.Println(string(response))
	}
	return nil
}

func postRequest(url string, data EmailData) ([]byte, error) {
	// Marshal the data into JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("error marshalling data: %v", err)
	}

	// Create a new POST request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Set the appropriate headers
	req.Header.Set("Content-Type", "application/json")

	// Send the request using http.Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %v", err)
	}

	// Check if the status code is not 200 (OK)
	if resp.StatusCode != http.StatusOK {
		return body, fmt.Errorf("error: status code %d, response: %s", resp.StatusCode, body)
	}

	return body, nil
}
