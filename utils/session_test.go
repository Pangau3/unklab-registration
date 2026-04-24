package utils

import (
	"testing"
	"time"
)

func TestBuildSessionTokenParsesBackToUsername(t *testing.T) {
	expiresAt := time.Now().Add(2 * time.Hour)
	token := BuildSessionToken("admin", expiresAt)

	username, err := ParseSessionToken(token)
	if err != nil {
		t.Fatalf("expected token to parse, got error: %v", err)
	}

	if username != "admin" {
		t.Fatalf("expected username admin, got %q", username)
	}
}

func TestParseSessionTokenRejectsExpiredToken(t *testing.T) {
	token := BuildSessionToken("admin", time.Now().Add(-1*time.Minute))

	if _, err := ParseSessionToken(token); err == nil {
		t.Fatal("expected expired token to be rejected")
	}
}
