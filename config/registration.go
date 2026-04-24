package config

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

type StatusFilterOption struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

type DocumentConfig struct {
	Label             string          `json:"label"`
	Accept            []string        `json:"accept"`
	MIMETypes         []string        `json:"mimeTypes"`
	Required          bool            `json:"required"`
	HelpText          string          `json:"helpText"`
	AllowedExtensions map[string]bool `json:"-"`
	AllowedMIMETypes  map[string]bool `json:"-"`
}

type RegistrationConfig struct {
	Programs            []string                  `json:"programs"`
	MaxUploadSizeBytes  int64                     `json:"maxUploadSizeBytes"`
	Documents           map[string]DocumentConfig `json:"documents"`
	StatusFilterOptions []StatusFilterOption      `json:"statusFilterOptions"`
	programSet          map[string]bool
}

var registrationConfig = mustLoadRegistrationConfig()

func Registration() *RegistrationConfig {
	return registrationConfig
}

func IsAllowedProgram(program string) bool {
	return registrationConfig.programSet[program]
}

func DocumentRule(key string) (DocumentConfig, bool) {
	document, ok := registrationConfig.Documents[key]
	return document, ok
}

func mustLoadRegistrationConfig() *RegistrationConfig {
	configPath := resolveRegistrationConfigPath()
	content, err := os.ReadFile(configPath)
	if err != nil {
		log.Fatalf("Gagal membaca konfigurasi pendaftaran %s: %v", configPath, err)
	}

	var cfg RegistrationConfig
	if err := json.Unmarshal(content, &cfg); err != nil {
		log.Fatalf("Gagal memuat konfigurasi pendaftaran: %v", err)
	}

	cfg.programSet = make(map[string]bool, len(cfg.Programs))
	for _, program := range cfg.Programs {
		cfg.programSet[program] = true
	}

	for key, document := range cfg.Documents {
		document.AllowedExtensions = make(map[string]bool, len(document.Accept))
		for _, extension := range document.Accept {
			document.AllowedExtensions[extension] = true
		}

		document.AllowedMIMETypes = make(map[string]bool, len(document.MIMETypes))
		for _, mimeType := range document.MIMETypes {
			document.AllowedMIMETypes[mimeType] = true
		}

		cfg.Documents[key] = document
	}

	return &cfg
}

func resolveRegistrationConfigPath() string {
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		return filepath.Join("shared", "registration-config.json")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(currentFile), "..", "shared", "registration-config.json"))
}
