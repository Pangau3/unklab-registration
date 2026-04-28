package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const csrfTokenHeader = "X-CSRF-Token"
const csrfCookieName = "csrf_token"
const csrfTokenLength = 32

func generateCSRFToken() (string, error) {
	bytes := make([]byte, csrfTokenLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie(csrfCookieName)
		if err != nil || cookie == "" {
			token, genErr := generateCSRFToken()
			if genErr != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "Gagal membuat token CSRF.",
				})
				return
			}
			c.SetCookie(csrfCookieName, token, 86400, "/", "", false, false)
			cookie = token
		}

		method := strings.ToUpper(c.Request.Method)
		if method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE" {
			headerToken := c.GetHeader(csrfTokenHeader)
			if headerToken == "" || headerToken != cookie {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "Token CSRF tidak valid. Refresh halaman dan coba lagi.",
				})
				return
			}
		}

		c.Next()
	}
}
