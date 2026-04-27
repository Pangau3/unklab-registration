package routes

import (
	"unklab-registration/controllers"
	"unklab-registration/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	router.Use(middleware.SecurityHeadersMiddleware())
	router.Use(middleware.CORSMiddleware())

	router.GET("/api/health", controllers.HealthCheck)

	api := router.Group("/api")
	{
		api.POST("/students/register", controllers.RegisterStudent)

		auth := api.Group("/auth")
		{
			auth.POST("/login", middleware.LoginRateLimitMiddleware(), controllers.Login)
			auth.POST("/logout", controllers.Logout)
			auth.GET("/me", middleware.AuthMiddleware(), controllers.Me)
		}

		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware())
		{
			admin.GET("/students", controllers.ListStudents)
			admin.GET("/students/:id", controllers.GetStudent)
			admin.PATCH("/students/:id/status", controllers.UpdateStatus)
			admin.DELETE("/students/:id", controllers.DeleteStudent)
			admin.GET("/students/:id/files/:kind", controllers.DownloadStudentDocument)
		}
	}

	SetupFrontendRoutes(router)
}
