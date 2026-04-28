package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func AuditLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		duration := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path
		clientIP := c.ClientIP()

		username := ""
		if user, ok := CurrentUser(c); ok {
			username = user.Username
		}

		if username != "" {
			log.Printf("[AUDIT] %s %s | %d | %v | IP: %s | user: %s",
				method, path, status, duration, clientIP, username)
		} else {
			log.Printf("[AUDIT] %s %s | %d | %v | IP: %s",
				method, path, status, duration, clientIP)
		}
	}
}
