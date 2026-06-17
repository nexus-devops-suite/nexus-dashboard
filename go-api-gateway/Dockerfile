FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy dependency files first
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o gateway main.go auth.go paddle_webhook.go patch_router.go ws_hub.go

# Runtime image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates

# Create non-root user 1000 and configure directory permissions
RUN adduser -D -u 1000 user
WORKDIR /app
COPY --from=builder --chown=user:user /app/gateway /app/gateway

USER user
EXPOSE 7860

CMD ["/app/gateway"]
