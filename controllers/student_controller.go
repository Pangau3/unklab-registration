package controllers

import (
	"net/http"
	"path/filepath"

	"unklab-registration/config"
	"unklab-registration/models"

	"github.com/gin-gonic/gin"
)

func ShowRegister(c *gin.Context) {
	c.HTML(http.StatusOK, "register.html", nil)
}

func RegisterStudent(c *gin.Context) {
	name := c.PostForm("name")
	email := c.PostForm("email")
	program := c.PostForm("program")

	// Validasi
	if name == "" || email == "" || program == "" {
		c.HTML(http.StatusBadRequest, "register.html", gin.H{
			"error": "Semua data wajib diisi!",
		})
		return
	}

	// Upload Dokumen
	photo, _ := c.FormFile("photo")
	ktp, _ := c.FormFile("ktp")
	ijazah, _ := c.FormFile("ijazah")

	photoPath := ""
	ktpPath := ""
	ijazahPath := ""

	if photo != nil {
		photoPath = "static/uploads/" + filepath.Base(photo.Filename)
		c.SaveUploadedFile(photo, photoPath)
	}
	if ktp != nil {
		ktpPath = "static/uploads/" + filepath.Base(ktp.Filename)
		c.SaveUploadedFile(ktp, ktpPath)
	}
	if ijazah != nil {
		ijazahPath = "static/uploads/" + filepath.Base(ijazah.Filename)
		c.SaveUploadedFile(ijazah, ijazahPath)
	}

	student := models.Student{
		Name:    name,
		Email:   email,
		Program: program,
		Photo:   photoPath,
		KTP:     ktpPath,
		Ijazah:  ijazahPath,
		Status:  "Pending",
	}

	config.DB.Create(&student)
	c.Redirect(http.StatusSeeOther, "/success")
}

func ShowIndex(c *gin.Context) {
	var students []models.Student
	config.DB.Find(&students)

	c.HTML(http.StatusOK, "index.html", gin.H{
		"students": students,
	})
}

func ShowSuccess(c *gin.Context) {
	c.HTML(http.StatusOK, "success.html", nil)
}
