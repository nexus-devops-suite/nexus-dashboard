package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow development environments
	},
}

type Client struct {
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.Mutex
}

var globalHub = Hub{
	clients:    make(map[*Client]bool),
	broadcast:  make(chan []byte),
	register:   make(chan *Client),
	unregister: make(chan *Client),
}

func (h *Hub) Run() {
	// Start a background metrics simulator that streams periodic memory heatmaps to clients
	go startTelemetrySimulator()

	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Println("New WebSocket client connected")
		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mutex.Unlock()
			log.Println("WebSocket client disconnected")
		case message := <-h.broadcast:
			h.mutex.Lock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mutex.Unlock()
		}
	}
}

// ServeWebSocket upgrades HTTP request to raw WebSocket
func ServeWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade websocket: %v", err)
		return
	}
	client := &Client{conn: conn, send: make(chan []byte, 256)}
	globalHub.register <- client

	// Read loop (process incoming messages/telemetry from daemon)
	go func() {
		defer func() {
			globalHub.unregister <- client
			conn.Close()
		}()
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				break
			}
			
			// Parse daemon events and broadcast them as alert_event to dashboard clients
			var daemonEvent struct {
				NodeID    string `json:"node_id"`
				EventType string `json:"event_type"`
				Details   string `json:"details"`
				Timestamp int64  `json:"timestamp"`
			}
			if err := json.Unmarshal(message, &daemonEvent); err == nil && daemonEvent.EventType != "" {
				level := "WARNING"
				if daemonEvent.EventType == "PATCH_REJECTED" || daemonEvent.EventType == "ERROR" {
					level = "CRITICAL"
				} else if daemonEvent.EventType == "PATCH_SUCCESS" || daemonEvent.EventType == "DAEMON_STARTUP" {
					level = "RESOLVED"
				}
				
				alert := map[string]interface{}{
					"id":        fmt.Sprintf("daemon_%d", time.Now().UnixNano()),
					"level":     level,
					"message":   fmt.Sprintf("[%s] %s - %s", daemonEvent.NodeID, daemonEvent.EventType, daemonEvent.Details),
					"timestamp": time.Unix(0, daemonEvent.Timestamp*int64(time.Millisecond)),
				}
				BroadcastEvent("alert_event", alert)
			}
		}
	}()

	// Write loop
	go func() {
		defer conn.Close()
		for {
			message, ok := <-client.send
			if !ok {
				conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			err := conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
		}
	}()
}

// BroadcastEvent publishes an event to all connected websockets
func BroadcastEvent(eventType string, data interface{}) {
	payload := map[string]interface{}{
		"type": eventType,
		"data": data,
	}
	bytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Failed to marshal event: %v", err)
		return
	}
	select {
	case globalHub.broadcast <- bytes:
	default:
		// Drop message if channel is full or hub is not running
	}
}

// Simulated real-time metrics streaming
func startTelemetrySimulator() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// 1. Stream simulated live memory heatmap updates
		heatmap := generateMockHeatmap()
		BroadcastEvent("heatmap_update", heatmap)

		// 2. Randomly stream system logs or warnings
		if rand.Float32() < 0.2 {
			alert := map[string]interface{}{
				"id":        fmt.Sprintf("alert_%d", time.Now().UnixNano()),
				"level":     "WARNING",
				"message":   "High execution spikes detected on hot-patched function 'auth.validate_token'",
				"timestamp": time.Now(),
			}
			BroadcastEvent("alert_event", alert)
		}
	}
}
func generateMockHeatmap() []map[string]interface{} {
	regions := []string{".text", ".data", ".rodata", "stack", "heap"}
	updates := []map[string]interface{}{}
	for _, r := range regions {
		updates = append(updates, map[string]interface{}{
			"region":     r,
			"load":       rand.Intn(100),
			"pages_rw":   rand.Intn(10) + 1,
			"executions": rand.Intn(1000) + 100,
		})
	}
	return updates
}
