package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	sqlite "github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Organization struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	Name           string    `json:"name"`
	Plan           string    `json:"plan"`
	Token          string    `gorm:"uniqueIndex" json:"token"`
	TrialStartedAt time.Time `json:"trial_started_at"`
	TrialEndsAt    time.Time `json:"trial_ends_at"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Cluster struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	OrgID       string    `gorm:"index" json:"org_id"`
	Name        string    `json:"name"`
	Environment string    `json:"environment"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type PatchRecord struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	ClusterID  string    `gorm:"index" json:"cluster_id"`
	TargetFunc string    `json:"target_fn"`
	RiskScore  int       `json:"risk_score"`
	Status     string    `json:"status"`
	Timestamp  time.Time `json:"timestamp"`
	Developer  string    `json:"developer"`
}

var db *gorm.DB

func main() {
	// 1. Initialize Database Connection (Postgres production or SQLite fallback)
	var err error
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL != "" {
		log.Println("Database: Connecting to production PostgreSQL database...")
		db, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	} else {
		dbPath := "/tmp/nexus.db"
		if os.PathSeparator == '\\' {
			dbPath = "nexus.db"
		}
		log.Printf("Database: DATABASE_URL not detected. Falling back to local SQLite database (%s)...\n", dbPath)
		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	}
	if err != nil {
		log.Fatalf("Failed to initialize GORM database connection: %v", err)
	}

	// 2. Auto-migrate schema tables
	err = db.AutoMigrate(&Organization{}, &Cluster{}, &PatchRecord{})
	if err != nil {
		log.Fatalf("Database auto-migration failed: %v", err)
	}

	// 3. Seed default developer organization if empty
	var orgCount int64
	db.Model(&Organization{}).Count(&orgCount)
	if orgCount == 0 {
		defaultOrg := Organization{
			ID:             "org_acme_dev_123",
			Name:           "Acme Dev Organization",
			Plan:           "Professional",
			Token:          "tok_developer_key_mock_123",
			TrialStartedAt: time.Now(),
			TrialEndsAt:    time.Now().AddDate(10, 0, 0), // 10 years developer trial
		}
		db.Create(&defaultOrg)
		log.Println("Seeded default developer org token: tok_developer_key_mock_123")

		defaultCluster := Cluster{
			ID:          "cls_main_99",
			OrgID:       "org_acme_dev_123",
			Name:        "production-main-cluster",
			Environment: "production",
			Status:      "HEALTHY",
		}
		db.Create(&defaultCluster)
		log.Println("Seeded default cluster ID: cls_main_99")
	}

	// 4. Initialize Gin Engine
	r := gin.Default()

	// 5. Enable CORS middleware for dashboard UI frontend interaction
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 6. Start the Global Web Socket Hub
	go globalHub.Run()

	// 7. WebSocket connection route (unauthenticated for telemetry stream)
	r.GET("/ws", ServeWebSocket)

	// 8. Unauthenticated paddle webhook and registration routes
	r.POST("/api/webhook/paddle", HandlePaddleWebhook)
	r.POST("/api/org/register", RegisterOrganization)

	// 9. Authenticated routes group for Daemon/CLI communication
	api := r.Group("/api")
	api.Use(AuthenticateToken())
	{
		api.POST("/patch/apply", RoutePatch)
		api.GET("/patch/history", GetPatchHistory)
		api.GET("/status", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":      "HEALTHY",
				"cluster_id":  "cls_main_99",
				"node_count":  12,
				"active_libs": []string{"libc.so.6", "libjvm.so", "libnode.so"},
			})
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "7860"
	}

	log.Printf("Starting Nexus API Gateway on port :%s...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Gateway failure: %v", err)
	}
}
