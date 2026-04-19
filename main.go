package main

import (
	"log"
	"unklab-registration/config"
	"unklab-registration/models"
	"unklab-registration/routes"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func seedAdmin() {
	var user models.User
	config.DB.Where("username = ?", "admin").First(&user)

	if user.ID == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin12345"), bcrypt.DefaultCost)
		config.DB.Create(&models.User{
			Username: "admin",
			Password: string(hashedPassword),
			Role:     "admin",
		})
		log.Println("Admin default berhasil dibuat!")
	}
}

func main() {
	gin.SetMode(gin.DebugMode)
	router := gin.Default()
	router.SetTrustedProxies(nil)

	// Koneksi Database
	config.ConnectDatabase()

	// Migrasi Database
	config.DB.AutoMigrate(&models.Student{}, &models.User{})

	// Buat akun admin default
	seedAdmin()

	// Static dan Template
	router.Static("/static", "./static")
	router.LoadHTMLGlob("templates/*")

	// Routes
	routes.SetupRoutes(router)

	// Jalankan Server
	router.Run(":8081")
}
