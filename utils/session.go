package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
	"unklab-registration/config"

	"github.com/gin-gonic/gin"
)

const SessionCookieName = "unklab_admin_session"

func BuildSessionToken(username string, expiresAt time.Time) string {
	payload := fmt.Sprintf("%s:%d", username, expiresAt.Unix())
	signature := signPayload(payload)

	return base64.RawURLEncoding.EncodeToString([]byte(payload)) + "." + base64.RawURLEncoding.EncodeToString(signature)
}

func ParseSessionToken(token string) (string, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", errors.New("format token tidak valid")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", errors.New("payload token tidak valid")
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", errors.New("signature token tidak valid")
	}

	payload := string(payloadBytes)
	if !hmac.Equal(signature, signPayload(payload)) {
		return "", errors.New("signature token tidak cocok")
	}

	payloadParts := strings.SplitN(payload, ":", 2)
	if len(payloadParts) != 2 {
		return "", errors.New("isi token tidak valid")
	}

	expiresAtUnix, err := strconv.ParseInt(payloadParts[1], 10, 64)
	if err != nil {
		return "", errors.New("masa berlaku token tidak valid")
	}

	if time.Now().Unix() > expiresAtUnix {
		return "", errors.New("token sudah kedaluwarsa")
	}

	if strings.TrimSpace(payloadParts[0]) == "" {
		return "", errors.New("username token tidak valid")
	}

	return payloadParts[0], nil
}

func SetSessionCookie(c *gin.Context, token string, maxAge int) {
	c.SetSameSite(config.CookieSameSite())
	c.SetCookie(
		SessionCookieName,
		token,
		maxAge,
		"/",
		config.CookieDomain(),
		config.SecureCookie(),
		true,
	)
}

func ClearSessionCookie(c *gin.Context) {
	c.SetSameSite(config.CookieSameSite())
	c.SetCookie(
		SessionCookieName,
		"",
		-1,
		"/",
		config.CookieDomain(),
		config.SecureCookie(),
		true,
	)
}

func signPayload(payload string) []byte {
	mac := hmac.New(sha256.New, []byte(sessionSecret()))
	mac.Write([]byte(payload))
	return mac.Sum(nil)
}

func sessionSecret() string {
	if secret := config.SessionSecret(); secret != "" {
		return secret
	}

	return "unklab-registration-dev-secret"
}
