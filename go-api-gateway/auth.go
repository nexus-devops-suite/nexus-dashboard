package main

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// AuthenticateToken intercepts requests to validate API tokens and map them to organizations.
func AuthenticateToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer token"})
			c.Abort()
			return
		}

		token := parts[1]

		// Query organization by token in GORM database
		var org Organization
		if err := db.Where("token = ?", token).First(&org).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid, revoked, or expired organization API token"})
			c.Abort()
			return
		}

		// Enforce 14-day trial lock on the Free tier
		if org.Plan == "Free" && time.Now().After(org.TrialEndsAt) {
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error": "Your 14-day free trial has expired. Please upgrade your subscription at https://console.nexus.dev/billing to restore service.",
				"trial_expired": true,
			})
			c.Abort()
			return
		}

		// Inject org metadata into Gin request context
		c.Set("org_name", org.Name)
		c.Set("token", token)
		c.Set("organization", &org)

		c.Next()
	}
}
