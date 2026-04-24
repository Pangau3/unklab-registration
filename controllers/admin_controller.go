package controllers

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"unklab-registration/config"
	"unklab-registration/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type updateStatusRequest struct {
	Status string `json:"status"`
}

func GetStudent(c *gin.Context) {
	studentID, err := strconv.Atoi(c.Param("id"))
	if err != nil || studentID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID mahasiswa tidak valid.",
		})
		return
	}

	student, err := findStudentByID(uint(studentID))
	if err != nil {
		renderStudentLookupError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"student": buildStudentResponse(*student),
	})
}

func ListStudents(c *gin.Context) {
	var students []models.Student
	if err := config.DB.Order("created_at DESC").Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil daftar pendaftar.",
		})
		return
	}

	response := make([]studentResponse, 0, len(students))
	summary := gin.H{
		"total":    0,
		"pending":  0,
		"approved": 0,
		"rejected": 0,
	}
	for _, student := range students {
		response = append(response, buildStudentResponse(student))
		summary["total"] = summary["total"].(int) + 1
		switch student.Status {
		case "Pending":
			summary["pending"] = summary["pending"].(int) + 1
		case "Approved":
			summary["approved"] = summary["approved"].(int) + 1
		case "Rejected":
			summary["rejected"] = summary["rejected"].(int) + 1
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"students": response,
		"summary":  summary,
	})
}

func UpdateStatus(c *gin.Context) {
	studentID, err := strconv.Atoi(c.Param("id"))
	if err != nil || studentID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID mahasiswa tidak valid.",
		})
		return
	}

	var request updateStatusRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Format update status tidak valid.",
		})
		return
	}

	status := strings.TrimSpace(request.Status)
	if status != "Pending" && status != "Approved" && status != "Rejected" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Status harus Pending, Approved, atau Rejected.",
		})
		return
	}

	student, err := findStudentByID(uint(studentID))
	if err != nil {
		renderStudentLookupError(c, err)
		return
	}

	student.Status = status
	if err := config.DB.Save(student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memperbarui status mahasiswa.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status mahasiswa berhasil diperbarui.",
		"student": buildStudentResponse(*student),
	})
}

func DownloadStudentDocument(c *gin.Context) {
	studentID, err := strconv.Atoi(c.Param("id"))
	if err != nil || studentID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID mahasiswa tidak valid.",
		})
		return
	}

	student, err := findStudentByID(uint(studentID))
	if err != nil {
		renderStudentLookupError(c, err)
		return
	}

	documentPath := ""
	switch c.Param("kind") {
	case "photo":
		documentPath = student.Photo
	case "ktp":
		documentPath = student.KTP
	case "ijazah":
		documentPath = student.Ijazah
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Jenis dokumen tidak dikenali.",
		})
		return
	}

	if documentPath == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Dokumen tidak tersedia.",
		})
		return
	}

	if _, err := os.Stat(documentPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "File dokumen tidak ditemukan.",
		})
		return
	}

	c.File(documentPath)
}

func findStudentByID(studentID uint) (*models.Student, error) {
	var student models.Student
	if err := config.DB.First(&student, studentID).Error; err != nil {
		return nil, err
	}

	return &student, nil
}

func renderStudentLookupError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Data mahasiswa tidak ditemukan.",
		})
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{
		"error": "Gagal mengambil data mahasiswa.",
	})
}
