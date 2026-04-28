package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unklab-registration/config"
	"unklab-registration/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type uploadRule struct {
	FieldName         string
	Label             string
	AllowedExtensions map[string]bool
	AllowedMIMETypes  map[string]bool
	Required          bool
}

func RegisterStudent(c *gin.Context) {
	name := strings.TrimSpace(c.PostForm("name"))
	email := strings.TrimSpace(strings.ToLower(c.PostForm("email")))
	phone := normalizePhone(c.PostForm("phone"))
	address := strings.TrimSpace(c.PostForm("address"))
	previousSchool := strings.TrimSpace(c.PostForm("previousSchool"))
	birthDate := strings.TrimSpace(c.PostForm("birthDate"))
	program := strings.TrimSpace(c.PostForm("program"))

	if validationErrors := validateRegistrationInput(name, email, phone, address, previousSchool, birthDate, program); len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Data pendaftaran belum valid.",
			"fields": validationErrors,
		})
		return
	}

	var existing models.Student
	err := config.DB.Where("email = ?", email).First(&existing).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Email sudah pernah digunakan untuk pendaftaran.",
			"fields": gin.H{
				"email": "Email ini sudah terdaftar.",
			},
		})
		return
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memeriksa data pendaftaran.",
		})
		return
	}

	var uploadedFiles []string

	photoRule, err := registrationUploadRule("photo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Konfigurasi upload foto tidak tersedia.",
		})
		return
	}

	photoPath, err := saveUpload(c, photoRule)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Dokumen pendaftaran belum valid.",
			"fields": gin.H{"photo": err.Error()},
		})
		return
	}
	uploadedFiles = append(uploadedFiles, photoPath)

	ktpRule, err := registrationUploadRule("ktp")
	if err != nil {
		cleanupUploadedFiles(uploadedFiles...)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Konfigurasi upload KTP tidak tersedia.",
		})
		return
	}

	ktpPath, err := saveUpload(c, ktpRule)
	if err != nil {
		cleanupUploadedFiles(uploadedFiles...)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Dokumen pendaftaran belum valid.",
			"fields": gin.H{"ktp": err.Error()},
		})
		return
	}
	uploadedFiles = append(uploadedFiles, ktpPath)

	ijazahRule, err := registrationUploadRule("ijazah")
	if err != nil {
		cleanupUploadedFiles(uploadedFiles...)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Konfigurasi upload ijazah tidak tersedia.",
		})
		return
	}

	ijazahPath, err := saveUpload(c, ijazahRule)
	if err != nil {
		cleanupUploadedFiles(uploadedFiles...)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "Dokumen pendaftaran belum valid.",
			"fields": gin.H{"ijazah": err.Error()},
		})
		return
	}
	uploadedFiles = append(uploadedFiles, ijazahPath)

	student := models.Student{
		Name:           name,
		Email:          email,
		Phone:          phone,
		Address:        address,
		PreviousSchool: previousSchool,
		BirthDate:      birthDate,
		Program:        program,
		Photo:          photoPath,
		KTP:            ktpPath,
		Ijazah:         ijazahPath,
		Status:         "Pending",
	}

	if err := config.DB.Create(&student).Error; err != nil {
		cleanupUploadedFiles(uploadedFiles...)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal menyimpan data pendaftaran.",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pendaftaran berhasil dikirim dan sedang menunggu verifikasi admin.",
		"student": buildStudentResponse(student),
	})
}

func CheckStudentStatus(c *gin.Context) {
	email := strings.TrimSpace(strings.ToLower(c.Query("email")))
	idParam := strings.TrimSpace(c.Query("id"))

	if email == "" && idParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Masukkan email atau ID pendaftar untuk memeriksa status.",
		})
		return
	}

	var student models.Student
	query := config.DB

	if idParam != "" {
		studentID, err := strconv.Atoi(idParam)
		if err != nil || studentID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Format ID pendaftar tidak valid.",
			})
			return
		}
		query = query.Where("id = ?", studentID)
	}

	if email != "" {
		query = query.Where("email = ?", email)
	}

	if err := query.First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Data pendaftaran tidak ditemukan. Pastikan email atau ID yang dimasukkan benar.",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memeriksa status pendaftaran.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"student": gin.H{
			"id":        student.ID,
			"name":      student.Name,
			"email":     student.Email,
			"program":   student.Program,
			"status":    student.Status,
			"createdAt": student.CreatedAt,
		},
	})
}

func validateRegistrationInput(name, email, phone, address, previousSchool, birthDate, program string) gin.H {
	validationErrors := gin.H{}

	if name == "" {
		validationErrors["name"] = "Nama lengkap wajib diisi."
	} else if len([]rune(name)) < 3 {
		validationErrors["name"] = "Nama lengkap minimal 3 karakter."
	}

	if email == "" {
		validationErrors["email"] = "Email wajib diisi."
	} else if _, err := mail.ParseAddress(email); err != nil {
		validationErrors["email"] = "Format email tidak valid."
	}

	if phone == "" {
		validationErrors["phone"] = "Nomor HP wajib diisi."
	} else if !isValidPhone(phone) {
		validationErrors["phone"] = "Nomor HP harus berisi 10 sampai 15 digit."
	}

	if address == "" {
		validationErrors["address"] = "Alamat wajib diisi."
	} else if len([]rune(address)) < 10 {
		validationErrors["address"] = "Alamat minimal 10 karakter."
	}

	if previousSchool == "" {
		validationErrors["previousSchool"] = "Asal sekolah wajib diisi."
	} else if len([]rune(previousSchool)) < 3 {
		validationErrors["previousSchool"] = "Asal sekolah minimal 3 karakter."
	}

	if birthDate == "" {
		validationErrors["birthDate"] = "Tanggal lahir wajib diisi."
	} else if _, err := time.Parse("2006-01-02", birthDate); err != nil {
		validationErrors["birthDate"] = "Format tanggal lahir tidak valid."
	}

	if program == "" {
		validationErrors["program"] = "Program studi wajib dipilih."
	} else if !config.IsAllowedProgram(program) {
		validationErrors["program"] = "Program studi tidak dikenali."
	}

	return validationErrors
}

func normalizePhone(input string) string {
	replacer := strings.NewReplacer(" ", "", "-", "", "(", "", ")", "")
	return strings.TrimSpace(replacer.Replace(input))
}

func isValidPhone(phone string) bool {
	if strings.HasPrefix(phone, "+") {
		phone = phone[1:]
	}

	if len(phone) < 10 || len(phone) > 15 {
		return false
	}

	for _, character := range phone {
		if character < '0' || character > '9' {
			return false
		}
	}

	return true
}

func saveUpload(c *gin.Context, rule uploadRule) (string, error) {
	file, err := c.FormFile(rule.FieldName)
	if err != nil {
		if errors.Is(err, http.ErrMissingFile) {
			if rule.Required {
				return "", fmt.Errorf("%s wajib diunggah", rule.Label)
			}
			return "", nil
		}
		return "", fmt.Errorf("gagal membaca file %s", strings.ToLower(rule.Label))
	}

	if file.Size > config.Registration().MaxUploadSizeBytes {
		return "", fmt.Errorf("ukuran %s maksimal 5 MB", strings.ToLower(rule.Label))
	}

	extension := strings.ToLower(filepath.Ext(file.Filename))
	if !rule.AllowedExtensions[extension] {
		return "", fmt.Errorf("format %s tidak didukung", strings.ToLower(rule.Label))
	}

	sourceFile, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("gagal membaca isi file %s", strings.ToLower(rule.Label))
	}
	defer sourceFile.Close()

	header := make([]byte, 512)
	readCount, err := sourceFile.Read(header)
	if err != nil && !errors.Is(err, io.EOF) {
		return "", fmt.Errorf("gagal memeriksa file %s", strings.ToLower(rule.Label))
	}

	mimeType := http.DetectContentType(header[:readCount])
	if !rule.AllowedMIMETypes[mimeType] {
		return "", fmt.Errorf("isi file %s tidak sesuai format yang diizinkan", strings.ToLower(rule.Label))
	}

	randomName, err := randomFilename(extension)
	if err != nil {
		return "", fmt.Errorf("gagal membuat nama file %s", strings.ToLower(rule.Label))
	}

	targetPath := filepath.Join("storage", "uploads", randomName)
	if err := c.SaveUploadedFile(file, targetPath); err != nil {
		return "", fmt.Errorf("gagal menyimpan file %s", strings.ToLower(rule.Label))
	}

	return targetPath, nil
}

func registrationUploadRule(fieldName string) (uploadRule, error) {
	document, ok := config.DocumentRule(fieldName)
	if !ok {
		return uploadRule{}, fmt.Errorf("aturan upload %s tidak ditemukan", fieldName)
	}

	return uploadRule{
		FieldName:         fieldName,
		Label:             document.Label,
		AllowedExtensions: document.AllowedExtensions,
		AllowedMIMETypes:  document.AllowedMIMETypes,
		Required:          document.Required,
	}, nil
}

func randomFilename(extension string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), hex.EncodeToString(buffer), extension), nil
}

func cleanupUploadedFiles(paths ...string) {
	for _, path := range paths {
		if path == "" {
			continue
		}

		_ = os.Remove(path)
	}
}
