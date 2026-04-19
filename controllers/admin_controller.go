package controllers

import (
	"net/http"
	"strconv"

	"unklab-registration/config"
	"unklab-registration/models"

	"github.com/gin-gonic/gin"
)

func AdminDashboard(c *gin.Context) {
	var students []models.Student
	config.DB.Find(&students)

	c.HTML(http.StatusOK, "admin.html", gin.H{
		"students": students,
	})
}

func UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	status := c.Param("status")

	studentID, _ := strconv.Atoi(id)
	var student models.Student

	config.DB.First(&student, studentID)
	student.Status = status
	config.DB.Save(&student)

	c.Redirect(http.StatusSeeOther, "/admin")
}
