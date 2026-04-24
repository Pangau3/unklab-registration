package controllers

import "testing"

func TestValidateRegistrationInputAcceptsValidPayload(t *testing.T) {
	errors := validateRegistrationInput(
		"John Doe",
		"john@example.com",
		"081234567890",
		"Jalan Raya No. 123, Airmadidi",
		"SMA Negeri 1",
		"2005-08-17",
		"Teknik Informatika",
	)

	if len(errors) != 0 {
		t.Fatalf("expected no validation errors, got %v", errors)
	}
}

func TestValidateRegistrationInputRejectsUnknownProgram(t *testing.T) {
	errors := validateRegistrationInput(
		"John Doe",
		"john@example.com",
		"081234567890",
		"Jalan Raya No. 123, Airmadidi",
		"SMA Negeri 1",
		"2005-08-17",
		"Program Tidak Ada",
	)

	if _, ok := errors["program"]; !ok {
		t.Fatalf("expected program validation error, got %v", errors)
	}
}
