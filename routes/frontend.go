package routes

import (
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

func SetupFrontendRoutes(router *gin.Engine) {
	distDir := filepath.Join("frontend", "dist")
	indexFile := filepath.Join(distDir, "index.html")

	if _, err := os.Stat(indexFile); err != nil {
		log.Println("Frontend build belum ditemukan. Jalankan `npm run build` di folder frontend untuk menyajikan UI dari backend.")
		router.NoRoute(func(c *gin.Context) {
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(http.StatusNotFound, gin.H{
					"error": "Endpoint tidak ditemukan.",
				})
				return
			}

			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "Frontend build belum tersedia. Jalankan `npm run build` di folder frontend.",
			})
		})
		return
	}

	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Endpoint tidak ditemukan.",
			})
			return
		}

		if assetPath, ok := resolveFrontendAsset(distDir, c.Request.URL.Path); ok {
			c.File(assetPath)
			return
		}

		c.File(indexFile)
	})
}

func resolveFrontendAsset(distDir, requestPath string) (string, bool) {
	cleanedPath := path.Clean("/" + requestPath)
	relativePath := strings.TrimPrefix(cleanedPath, "/")
	if relativePath == "" {
		return "", false
	}

	assetPath := filepath.Join(distDir, filepath.FromSlash(relativePath))
	fileInfo, err := os.Stat(assetPath)
	if err != nil || fileInfo.IsDir() {
		return "", false
	}

	return assetPath, true
}
