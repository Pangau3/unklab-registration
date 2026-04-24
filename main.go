package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"unklab-registration/config"
	"unklab-registration/models"
	"unklab-registration/routes"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

const minimumProductionAdminPasswordLength = 12

func seedAdmin() error {
	var adminCount int64
	if err := config.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount).Error; err != nil {
		return err
	}

	if adminCount > 0 {
		log.Println("Bootstrap admin dilewati karena akun admin sudah tersedia.")
		return nil
	}

	if !config.AdminBootstrapEnabled() {
		if config.AppEnvironment() == "production" {
			return fmt.Errorf("akun admin belum ada. Set ADMIN_BOOTSTRAP=true beserta ADMIN_USERNAME dan ADMIN_PASSWORD untuk bootstrap awal")
		}

		log.Println("Bootstrap admin dinonaktifkan dan belum ada akun admin yang dibuat.")
		return nil
	}

	adminUsername := strings.TrimSpace(os.Getenv("ADMIN_USERNAME"))
	adminPassword := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD"))

	if adminUsername == "" || adminPassword == "" {
		if config.AppEnvironment() == "production" {
			return fmt.Errorf("ADMIN_USERNAME dan ADMIN_PASSWORD wajib diisi saat APP_ENV=production")
		}

		if adminUsername == "" {
			adminUsername = "admin"
		}
		if adminPassword == "" {
			adminPassword = "admin12345"
		}

		log.Println("Menggunakan kredensial admin bootstrap default untuk environment development.")
	}

	if config.AppEnvironment() == "production" && len(adminPassword) < minimumProductionAdminPasswordLength {
		return fmt.Errorf("ADMIN_PASSWORD minimal %d karakter saat APP_ENV=production", minimumProductionAdminPasswordLength)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := config.DB.Create(&models.User{
		Username: adminUsername,
		Password: string(hashedPassword),
		Role:     "admin",
	}).Error; err != nil {
		return err
	}

	log.Println("Akun admin bootstrap berhasil dibuat.")
	return nil
}

func ensureStorage() error {
	return os.MkdirAll("storage/uploads", 0o755)
}

func main() {
	if err := config.ValidateRuntime(); err != nil {
		log.Fatal("Konfigurasi runtime tidak valid: ", err)
	}

	gin.SetMode(config.GinMode())
	router := gin.Default()
	if err := router.SetTrustedProxies(config.TrustedProxies()); err != nil {
		log.Fatal("Konfigurasi trusted proxies tidak valid: ", err)
	}
	router.MaxMultipartMemory = 8 << 20

	config.ConnectDatabase()

	if err := config.DB.AutoMigrate(&models.Student{}, &models.User{}); err != nil {
		log.Fatal("Gagal migrasi database: ", err)
	}

	if err := ensureStorage(); err != nil {
		log.Fatal("Gagal menyiapkan penyimpanan file: ", err)
	}

	if err := seedAdmin(); err != nil {
		log.Fatal("Gagal membuat admin default: ", err)
	}

	routes.SetupRoutes(router)

	if err := router.Run(":" + config.HTTPPort()); err != nil {
		log.Fatal("Gagal menjalankan server: ", err)
	}
}
