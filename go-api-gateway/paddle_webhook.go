package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type PaddleWebhookEvent struct {
	EventName string `json:"event_name"`
	Data      struct {
		SubscriptionID string `json:"subscription_id"`
		CustomerID     string `json:"customer_id"`
		PlanID         string `json:"plan_id"`
		Status         string `json:"status"` // active, trialing, deleted
	} `json:"data"`
}

type RegisterPayload struct {
	OrgName string `json:"org_name" binding:"required"`
	Email   string `json:"email" binding:"required"`
	Plan    string `json:"plan" binding:"required"`
}

// RegisterOrganization creates a new organization record, generates a cryptographically secure API key, and stores it in GORM database.
func RegisterOrganization(c *gin.Context) {
	var payload RegisterPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate secure token: tok_orgname_16randchars
	cleanOrgName := strings.ToLower(payload.OrgName)
	cleanOrgName = strings.ReplaceAll(cleanOrgName, " ", "")
	
	bytes := make([]byte, 10)
	if _, err := rand.Read(bytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate security token"})
		return
	}
	token := fmt.Sprintf("tok_%s_%x", cleanOrgName, bytes)
	orgID := fmt.Sprintf("org_%d", time.Now().UnixNano())

	trialStart := time.Now()
	trialEnd := trialStart.AddDate(0, 0, 14) // 14 days free trial

	org := Organization{
		ID:             orgID,
		Name:           payload.OrgName,
		Plan:           payload.Plan,
		Token:          token,
		TrialStartedAt: trialStart,
		TrialEndsAt:    trialEnd,
	}

	if err := db.Create(&org).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register organization in database"})
		return
	}

	log.Printf("Registered new organization '%s' (ID: %s, Plan: %s)", org.Name, org.ID, org.Plan)

	c.JSON(http.StatusOK, gin.H{
		"token":  token,
		"org_id": orgID,
		"status": "success",
	})
}

// HandlePaddleWebhook parses incoming Paddle webhook payloads and synchronizes organization tier statuses.
func HandlePaddleWebhook(c *gin.Context) {
	var event PaddleWebhookEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook payload structure"})
		return
	}

	log.Printf("Received Paddle Webhook: %s for Subscription %s", event.EventName, event.Data.SubscriptionID)

	var org Organization
	if err := db.Where("id = ?", event.Data.CustomerID).First(&org).Error; err == nil {
		org.Plan = event.Data.PlanID
		db.Save(&org)
		log.Printf("Successfully synchronized subscription plan to '%s' for Org ID: %s", event.Data.PlanID, org.ID)
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "synchronized",
		"message": "Paddle subscription status processed successfully",
	})
}
