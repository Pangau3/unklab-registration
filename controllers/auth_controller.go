package controllers

import (
	"net/http"
	"unklab-registration/config"
	"unklab-registration/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Menampilkan halaman login
func ShowLogin(c *gin.Context) {
	c.HTML(http.StatusOK, "login.html", nil)
}

// Proses login
func Login(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	var user models.User
	if err := config.DB.Where("username = ?", username).First(&user).Error; err != nil {
		c.HTML(http.StatusUnauthorized, "login.html", gin.H{
			"error": "Username atau password salah",
		})
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		c.HTML(http.StatusUnauthorized, "login.html", gin.H{
			"error": "Username atau password salah",
		})
		return
	}

	// Simpan session dalam cookie
	c.SetCookie("session", username, 3600, "/", "", false, true)
	c.Redirect(http.StatusSeeOther, "/admin")
}

// Logout
func Logout(c *gin.Context) {
	c.SetCookie("session", "", -1, "/", "", false, true)
	c.Redirect(http.StatusSeeOther, "/login")
}
