package middleware

import (
	"net/http"
	"unklab-registration/config"
	"unklab-registration/models"
	"unklab-registration/utils"

	"github.com/gin-gonic/gin"
)

const currentUserKey = "currentUser"

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(utils.SessionCookieName)
		if err != nil || token == "" {
			utils.ClearSessionCookie(c)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Silakan login sebagai admin.",
			})
			c.Abort()
			return
		}

		username, err := utils.ParseSessionToken(token)
		if err != nil {
			utils.ClearSessionCookie(c)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Sesi login tidak valid atau sudah berakhir.",
			})
			c.Abort()
			return
		}

		var user models.User
		if err := config.DB.Where("username = ? AND role = ?", username, "admin").First(&user).Error; err != nil {
			utils.ClearSessionCookie(c)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Akun admin tidak ditemukan.",
			})
			c.Abort()
			return
		}

		c.Set(currentUserKey, &user)
		c.Next()
	}
}

func CurrentUser(c *gin.Context) (*models.User, bool) {
	userValue, exists := c.Get(currentUserKey)
	if !exists {
		return nil, false
	}

	user, ok := userValue.(*models.User)
	return user, ok
}
