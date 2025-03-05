package parser

import (
	"fmt"
	"os"
	"strings"
)

func IsSpam(content string) bool {
	spamWords, err := os.ReadFile("spam.txt")
	if err != nil {
		fmt.Println(err)
		return false
	}
	//  convert spamWords to string
	spamWordsStr := string(spamWords)
	spamWordsArr := strings.Split(spamWordsStr, "\n")

	for _, word := range spamWordsArr {
		word = strings.TrimSpace(word)
		if word != "" && strings.Contains(strings.ToLower(content), word) {
			fmt.Println("Detected spam word: ", word)
			return true
		}
	}

	return false
}

func IsBacklistedDomain(email string) bool {
	blacklistedDomains, err := os.ReadFile("domain-blacklist.txt")
	if err != nil {
		fmt.Println(err)
		return false
	}
	//  convert blacklistedDomains to string
	blacklistedDomainsStr := string(blacklistedDomains)
	// blacklistedDomainsArr := strings.Split(blacklistedDomainsStr, "\n")

	atIndex := strings.LastIndex(email, "@")
	if atIndex == -1 {
		return true
	}
	emailDomain := email[atIndex+1:]
	return strings.Contains(blacklistedDomainsStr, emailDomain+"\n")
}
