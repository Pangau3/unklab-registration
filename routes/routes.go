package routes

import (
	"unklab-registration/controllers"
	"unklab-registration/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	// Public Routes
	router.GET("/", controllers.ShowIndex)
	router.GET("/register", controllers.ShowRegister)
	router.POST("/register", controllers.RegisterStudent)
	router.GET("/success", controllers.ShowSuccess)

	// Authentication Routes
	router.GET("/login", controllers.ShowLogin)
	router.POST("/login", controllers.Login)
	router.GET("/logout", controllers.Logout)

	// Protected Admin Routes
	admin := router.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	{
		admin.GET("", controllers.AdminDashboard)
		admin.GET("/update/:id/:status", controllers.UpdateStatus)
	}
}
