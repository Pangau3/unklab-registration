package controllers

import (
	"encoding/csv"
	"errors"
	"fmt"
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

type bulkUpdateStatusRequest struct {
	IDs    []uint `json:"ids"`
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

func BulkUpdateStatus(c *gin.Context) {
	var request bulkUpdateStatusRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Format permintaan tidak valid.",
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

	if len(request.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Pilih setidaknya satu pendaftar.",
		})
		return
	}

	if len(request.IDs) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Maksimal 100 pendaftar per batch.",
		})
		return
	}

	result := config.DB.Model(&models.Student{}).Where("id IN ?", request.IDs).Update("status", status)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal memperbarui status secara batch.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%d pendaftar berhasil diperbarui ke status %s.", result.RowsAffected, status),
		"updated": result.RowsAffected,
	})
}

func ExportStudentsCSV(c *gin.Context) {
	var students []models.Student
	if err := config.DB.Order("created_at DESC").Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal mengambil data pendaftar untuk export.",
		})
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=pendaftar-unklab.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	header := []string{"ID", "Nama", "Email", "Telepon", "Alamat", "Asal Sekolah", "Tanggal Lahir", "Program Studi", "Status", "Tanggal Daftar"}
	if err := writer.Write(header); err != nil {
		return
	}

	for _, student := range students {
		row := []string{
			strconv.FormatUint(uint64(student.ID), 10),
			student.Name,
			student.Email,
			student.Phone,
			student.Address,
			student.PreviousSchool,
			student.BirthDate,
			student.Program,
			student.Status,
			student.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(row); err != nil {
			return
		}
	}
}

func DeleteStudent(c *gin.Context) {
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

	documentPaths := []string{student.Photo, student.KTP, student.Ijazah}
	studentName := student.Name
	deletedStudentID := student.ID

	if err := config.DB.Delete(student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal menghapus data mahasiswa.",
		})
		return
	}

	cleanupUploadedFiles(documentPaths...)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Data mahasiswa berhasil dihapus.",
		"studentId":   deletedStudentID,
		"studentName": studentName,
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
