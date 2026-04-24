package controllers

import (
	"fmt"
	"mime"
	"path/filepath"
	"strings"
	"time"
	"unklab-registration/models"
)

type studentDocumentResponse struct {
	URL         string `json:"url,omitempty"`
	FileName    string `json:"fileName,omitempty"`
	ContentType string `json:"contentType,omitempty"`
}

type studentDocumentsResponse struct {
	Photo  studentDocumentResponse `json:"photo"`
	KTP    studentDocumentResponse `json:"ktp"`
	Ijazah studentDocumentResponse `json:"ijazah"`
}

type studentResponse struct {
	ID             uint                     `json:"id"`
	Name           string                   `json:"name"`
	Email          string                   `json:"email"`
	Phone          string                   `json:"phone"`
	Address        string                   `json:"address"`
	PreviousSchool string                   `json:"previousSchool"`
	BirthDate      string                   `json:"birthDate"`
	Program        string                   `json:"program"`
	Status         string                   `json:"status"`
	CreatedAt      time.Time                `json:"createdAt"`
	Documents      studentDocumentsResponse `json:"documents"`
}

func buildStudentResponse(student models.Student) studentResponse {
	response := studentResponse{
		ID:             student.ID,
		Name:           student.Name,
		Email:          student.Email,
		Phone:          student.Phone,
		Address:        student.Address,
		PreviousSchool: student.PreviousSchool,
		BirthDate:      student.BirthDate,
		Program:        student.Program,
		Status:         student.Status,
		CreatedAt:      student.CreatedAt,
	}

	if student.Photo != "" {
		response.Documents.Photo = buildStudentDocumentResponse(student.ID, "photo", student.Photo)
	}
	if student.KTP != "" {
		response.Documents.KTP = buildStudentDocumentResponse(student.ID, "ktp", student.KTP)
	}
	if student.Ijazah != "" {
		response.Documents.Ijazah = buildStudentDocumentResponse(student.ID, "ijazah", student.Ijazah)
	}

	return response
}

func buildStudentDocumentResponse(studentID uint, kind, documentPath string) studentDocumentResponse {
	extension := strings.ToLower(filepath.Ext(documentPath))
	contentType := mime.TypeByExtension(extension)
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return studentDocumentResponse{
		URL:         fmt.Sprintf("/api/admin/students/%d/files/%s", studentID, kind),
		FileName:    filepath.Base(documentPath),
		ContentType: contentType,
	}
}
