package config

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	databasePath := DatabasePath()
	if err := EnsureParentDirectory(databasePath); err != nil {
		log.Fatal("Gagal menyiapkan direktori database: ", err)
	}

	database, err := gorm.Open(sqlite.Open(databasePath), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal terhubung ke database: ", err)
	}

	log.Printf("Database berhasil terhubung: %s\n", databasePath)
	DB = database
}
