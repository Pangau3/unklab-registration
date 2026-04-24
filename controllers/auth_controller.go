package controllers

import (
	"net/http"
	"strings"
	"time"
	"unklab-registration/config"
	"unklab-registration/middleware"
	"unklab-registration/models"
	"unklab-registration/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type authUserResponse struct {
	Username string `json:"username"`
	Role     string `json:"role"`
}

func Login(c *gin.Context) {
	var request loginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Format login tidak valid.",
		})
		return
	}

	request.Username = strings.TrimSpace(request.Username)
	request.Password = strings.TrimSpace(request.Password)
	if request.Username == "" || request.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Username dan password wajib diisi.",
			"fields": gin.H{"username": "Username wajib diisi.", "password": "Password wajib diisi."},
		})
		return
	}

	var user models.User
	if err := config.DB.Where("username = ? AND role = ?", request.Username, "admin").First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Username atau password salah.",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(request.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Username atau password salah.",
		})
		return
	}

	sessionDuration := config.SessionDuration()
	expiresAt := time.Now().Add(sessionDuration)
	token := utils.BuildSessionToken(user.Username, expiresAt)
	utils.SetSessionCookie(c, token, int(sessionDuration.Seconds()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Login admin berhasil.",
		"user": authUserResponse{
			Username: user.Username,
			Role:     user.Role,
		},
	})
}

func Logout(c *gin.Context) {
	utils.ClearSessionCookie(c)
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout berhasil.",
	})
}

func Me(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Sesi login tidak ditemukan.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": authUserResponse{
			Username: user.Username,
			Role:     user.Role,
		},
	})
}
