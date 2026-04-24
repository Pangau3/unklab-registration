package config

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	defaultPort         = "8081"
	defaultDatabasePath = "storage/unklab.db"
	legacyDatabasePath  = "unklab.db"
)

func AppEnvironment() string {
	value := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if value != "" {
		return value
	}

	if strings.TrimSpace(os.Getenv("GIN_MODE")) == gin.ReleaseMode {
		return "production"
	}

	return "development"
}

func GinMode() string {
	value := strings.TrimSpace(os.Getenv("GIN_MODE"))
	if value != "" {
		return value
	}

	if AppEnvironment() == "production" {
		return gin.ReleaseMode
	}

	return gin.DebugMode
}

func HTTPPort() string {
	value := strings.TrimSpace(os.Getenv("PORT"))
	if value != "" {
		return value
	}

	return defaultPort
}

func DatabasePath() string {
	value := strings.TrimSpace(os.Getenv("DB_PATH"))
	if value != "" {
		return value
	}

	if _, err := os.Stat(defaultDatabasePath); err == nil {
		return defaultDatabasePath
	}

	if _, err := os.Stat(legacyDatabasePath); err == nil {
		return legacyDatabasePath
	}

	return defaultDatabasePath
}

func SessionSecret() string {
	return strings.TrimSpace(os.Getenv("SESSION_SECRET"))
}

func SecureCookie() bool {
	value := strings.TrimSpace(os.Getenv("COOKIE_SECURE"))
	if value != "" {
		secure, err := strconv.ParseBool(value)
		if err == nil {
			return secure
		}
	}

	return AppEnvironment() == "production"
}

func CookieDomain() string {
	return strings.TrimSpace(os.Getenv("COOKIE_DOMAIN"))
}

func CookieSameSite() http.SameSite {
	value := strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SAME_SITE")))
	switch value {
	case "", "lax":
		return http.SameSiteLaxMode
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func SessionDuration() time.Duration {
	value := strings.TrimSpace(os.Getenv("SESSION_TTL"))
	if value == "" {
		return 12 * time.Hour
	}

	duration, err := time.ParseDuration(value)
	if err != nil || duration <= 0 {
		return 12 * time.Hour
	}

	return duration
}

func AdminBootstrapEnabled() bool {
	value := strings.TrimSpace(os.Getenv("ADMIN_BOOTSTRAP"))
	if value == "" {
		return AppEnvironment() != "production"
	}

	enabled, err := strconv.ParseBool(value)
	if err != nil {
		return AppEnvironment() != "production"
	}

	return enabled
}

func AllowedOrigins() []string {
	value := strings.TrimSpace(os.Getenv("FRONTEND_ORIGIN"))
	if value == "" {
		return []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		}
	}

	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin == "" || slices.Contains(origins, origin) {
			continue
		}

		origins = append(origins, origin)
	}

	if len(origins) == 0 {
		return []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		}
	}

	return origins
}

func TrustedProxies() []string {
	value := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES"))
	if value == "" {
		return nil
	}

	parts := strings.Split(value, ",")
	proxies := make([]string, 0, len(parts))
	for _, part := range parts {
		proxy := strings.TrimSpace(part)
		if proxy == "" || slices.Contains(proxies, proxy) {
			continue
		}

		proxies = append(proxies, proxy)
	}

	if len(proxies) == 0 {
		return nil
	}

	return proxies
}

func LoginRateLimitEnabled() bool {
	value := strings.TrimSpace(os.Getenv("LOGIN_RATE_LIMIT_ENABLED"))
	if value == "" {
		return true
	}

	enabled, err := strconv.ParseBool(value)
	if err != nil {
		return true
	}

	return enabled
}

func LoginRateLimitMaxAttempts() int {
	value := strings.TrimSpace(os.Getenv("LOGIN_RATE_LIMIT_MAX_ATTEMPTS"))
	if value == "" {
		return 5
	}

	maxAttempts, err := strconv.Atoi(value)
	if err != nil || maxAttempts <= 0 {
		return 5
	}

	return maxAttempts
}

func LoginRateLimitWindow() time.Duration {
	value := strings.TrimSpace(os.Getenv("LOGIN_RATE_LIMIT_WINDOW"))
	if value == "" {
		return 15 * time.Minute
	}

	window, err := time.ParseDuration(value)
	if err != nil || window <= 0 {
		return 15 * time.Minute
	}

	return window
}

func ValidateRuntime() error {
	if AppEnvironment() == "production" && SessionSecret() == "" {
		return errors.New("SESSION_SECRET wajib diisi saat APP_ENV=production")
	}

	if CookieSameSite() == http.SameSiteNoneMode && !SecureCookie() {
		return errors.New("COOKIE_SAME_SITE=none membutuhkan COOKIE_SECURE=true")
	}

	if SessionDuration() <= 0 {
		return errors.New("SESSION_TTL harus lebih besar dari 0")
	}

	if LoginRateLimitEnabled() && LoginRateLimitWindow() <= 0 {
		return errors.New("LOGIN_RATE_LIMIT_WINDOW harus lebih besar dari 0")
	}

	if LoginRateLimitEnabled() && LoginRateLimitMaxAttempts() <= 0 {
		return errors.New("LOGIN_RATE_LIMIT_MAX_ATTEMPTS harus lebih besar dari 0")
	}

	return nil
}

func EnsureParentDirectory(targetPath string) error {
	parent := filepath.Dir(targetPath)
	if parent == "." || parent == "" {
		return nil
	}

	return os.MkdirAll(parent, 0o755)
}
