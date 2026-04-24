package middleware

import (
	"testing"
	"time"
)

func TestFixedWindowRateLimiterBlocksAfterMaxAttempts(t *testing.T) {
	now := time.Date(2026, 4, 24, 12, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowRateLimiter(2, time.Minute)
	limiter.now = func() time.Time {
		return now
	}

	if allowed, _ := limiter.Allow("127.0.0.1"); !allowed {
		t.Fatal("expected first attempt to be allowed")
	}

	if allowed, _ := limiter.Allow("127.0.0.1"); !allowed {
		t.Fatal("expected second attempt to be allowed")
	}

	allowed, retryAfter := limiter.Allow("127.0.0.1")
	if allowed {
		t.Fatal("expected third attempt to be blocked")
	}

	if retryAfter <= 0 {
		t.Fatalf("expected retryAfter to be positive, got %v", retryAfter)
	}
}

func TestFixedWindowRateLimiterResetsAfterWindow(t *testing.T) {
	now := time.Date(2026, 4, 24, 12, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowRateLimiter(1, time.Minute)
	limiter.now = func() time.Time {
		return now
	}

	if allowed, _ := limiter.Allow("127.0.0.1"); !allowed {
		t.Fatal("expected first attempt to be allowed")
	}

	now = now.Add(2 * time.Minute)
	if allowed, _ := limiter.Allow("127.0.0.1"); !allowed {
		t.Fatal("expected limiter window to reset")
	}
}
