package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"
	"unklab-registration/config"

	"github.com/gin-gonic/gin"
)

type rateLimitEntry struct {
	count   int
	resetAt time.Time
}

type FixedWindowRateLimiter struct {
	mu          sync.Mutex
	maxAttempts int
	window      time.Duration
	now         func() time.Time
	entries     map[string]rateLimitEntry
}

func NewFixedWindowRateLimiter(maxAttempts int, window time.Duration) *FixedWindowRateLimiter {
	return &FixedWindowRateLimiter{
		maxAttempts: maxAttempts,
		window:      window,
		now:         time.Now,
		entries:     make(map[string]rateLimitEntry),
	}
}

func (limiter *FixedWindowRateLimiter) Allow(key string) (bool, time.Duration) {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	now := limiter.now()
	entry, exists := limiter.entries[key]
	if !exists || !now.Before(entry.resetAt) {
		limiter.entries[key] = rateLimitEntry{
			count:   1,
			resetAt: now.Add(limiter.window),
		}
		return true, 0
	}

	if entry.count >= limiter.maxAttempts {
		return false, entry.resetAt.Sub(now)
	}

	entry.count++
	limiter.entries[key] = entry
	return true, 0
}

func LoginRateLimitMiddleware() gin.HandlerFunc {
	if !config.LoginRateLimitEnabled() {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	limiter := NewFixedWindowRateLimiter(
		config.LoginRateLimitMaxAttempts(),
		config.LoginRateLimitWindow(),
	)

	return func(c *gin.Context) {
		allowed, retryAfter := limiter.Allow(c.ClientIP())
		if allowed {
			c.Next()
			return
		}

		retryAfterSeconds := int(retryAfter.Seconds())
		if retryAfterSeconds < 1 {
			retryAfterSeconds = 1
		}

		c.Header("Retry-After", strconv.Itoa(retryAfterSeconds))
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error": "Terlalu banyak percobaan login. Coba lagi beberapa saat lagi.",
		})
		c.Abort()
	}
}
