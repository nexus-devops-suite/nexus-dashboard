package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type PatchPayload struct {
	ClusterID  string `json:"cluster_id" binding:"required"`
	TargetFunc string `json:"target_fn" binding:"required"`
	PatchBytes string `json:"patch_bytes" binding:"required"`
	Signature  string `json:"signature" binding:"required"`
	PublicKey  string `json:"public_key" binding:"required"`
}

// RoutePatch receives an ED25519 signed hot-patch payload, verifies it, and coordinates delivery.
func RoutePatch(c *gin.Context) {
	var payload PatchPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Verify ED25519 signature of the patch payload
	pubKeyBytes, err := hex.DecodeString(payload.PublicKey)
	if err != nil || len(pubKeyBytes) != ed25519.PublicKeySize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid public key format"})
		return
	}

	sigBytes, err := hex.DecodeString(payload.Signature)
	if err != nil || len(sigBytes) != ed25519.SignatureSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature format"})
		return
	}

	patchData, err := hex.DecodeString(payload.PatchBytes)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid hex encoding for patch bytes"})
		return
	}

	// Verify cryptographic signature
	message := []byte(fmt.Sprintf("%s:%s:%s", payload.ClusterID, payload.TargetFunc, payload.PatchBytes))
	if !ed25519.Verify(pubKeyBytes, message, sigBytes) {
		c.JSON(http.StatusForbidden, gin.H{"error": "ED25519 cryptographic signature verification failed"})
		return
	}

	// Calculate a mock risk score based on length of patch bytes (simulating Offline Mistral Model)
	riskScore := 15
	if len(patchData) > 50 {
		riskScore = 78 // High risk
	}

	orgName, _ := c.Get("org_name")

	record := PatchRecord{
		ID:         fmt.Sprintf("patch_%d", time.Now().UnixNano()),
		ClusterID:  payload.ClusterID,
		TargetFunc: payload.TargetFunc,
		RiskScore:  riskScore,
		Status:     "PENDING_APPROVAL",
		Timestamp:  time.Now(),
		Developer:  fmt.Sprintf("Dev via %s", orgName),
	}

	if riskScore < 50 {
		record.Status = "DEPLOYED"
	}

	// Save patch record using GORM database transaction
	if err := db.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist patch record to database"})
		return
	}

	// Broadcast the patch update to WebSocket subscribers (dashboard clients)
	BroadcastEvent("patch_event", record)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Patch verified successfully",
		"patch_id":   record.ID,
		"risk_score": riskScore,
		"status":     record.Status,
	})
}

// GetPatchHistory returns the history of hot-swapped patches
func GetPatchHistory(c *gin.Context) {
	var records []PatchRecord
	if err := db.Order("timestamp desc").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query patch audit logs"})
		return
	}
	c.JSON(http.StatusOK, records)
}
