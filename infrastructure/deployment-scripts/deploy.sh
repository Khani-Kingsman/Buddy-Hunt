#!/bin/bash

# Buddy Hunt - Production Deployment Script
# Industrial-grade deployment with zero-downtime and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/deploy-config.env"
HELM_CHART_PATH="${SCRIPT_DIR}/../k8s/helm-charts/buddy-hunt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load configuration
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
else
    log_error "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Validate required variables
required_vars=(
    "ENVIRONMENT"
    "KUBERNETES_CONTEXT"
    "NAMESPACE"
    "IMAGE_TAG"
    "CONTAINER_REGISTRY"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        log_error "Required variable $var is not set"
        exit 1
    fi
done

# Functions
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check kubernetes context
    if ! kubectl config use-context "$KUBERNETES_CONTEXT" &> /dev/null; then
        log_error "Failed to switch to kubernetes context: $KUBERNETES_CONTEXT"
        exit 1
    fi
    
    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE doesn't exist, creating..."
        kubectl create namespace "$NAMESPACE"
    fi
    
    log_success "Prerequisites check completed"
}

setup_secrets() {
    log_info "Setting up secrets..."
    
    # Database secrets
    kubectl create secret generic postgres-secret \
        --from-literal=postgres-password="${POSTGRES_PASSWORD}" \
        --from-literal=username="${POSTGRES_USER}" \
        --from-literal=password="${POSTGRES_APP_PASSWORD}" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Redis secret
    kubectl create secret generic redis-secret \
        --from-literal=redis-password="${REDIS_PASSWORD}" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # JWT secrets
    kubectl create secret generic jwt-secret \
        --from-literal=jwt-secret="${JWT_SECRET}" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # AWS credentials for S3 access
    kubectl create secret generic aws-credentials \
        --from-literal=aws-access-key-id="${AWS_ACCESS_KEY_ID}" \
        --from-literal=aws-secret-access-key="${AWS_SECRET_ACCESS_KEY}" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Container registry credentials
    kubectl create secret docker-registry registry-secret \
        --docker-server="${CONTAINER_REGISTRY}" \
        --docker-username="${REGISTRY_USERNAME}" \
        --docker-password="${REGISTRY_PASSWORD}" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Secrets setup completed"
}

build_and_push_images() {
    log_info "Building and pushing container images..."
    
    # Services to build
    services=("api" "websocket" "sfu")
    
    for service in "${services[@]}"; do
        log_info "Building $service service..."
        
        # Build image
        docker build \
            -t "${CONTAINER_REGISTRY}/buddyhunt-${service}:${IMAGE_TAG}" \
            -f "docker/Dockerfile.${service}" \
            .
        
        # Push image
        docker push "${CONTAINER_REGISTRY}/buddyhunt-${service}:${IMAGE_TAG}"
        
        log_success "$service image built and pushed"
    done
    
    log_success "All images built and pushed"
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Create migration job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-${IMAGE_TAG}
  namespace: ${NAMESPACE}
spec:
  template:
    spec:
      containers:
      - name: migration
        image: ${CONTAINER_REGISTRY}/buddyhunt-api:${IMAGE_TAG}
        command: ["npm", "run", "migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: database-url
      restartPolicy: Never
  backoffLimit: 3
EOF
    
    # Wait for migration to complete
    log_info "Waiting for database migration to complete..."
    kubectl wait --for=condition=complete --timeout=300s "job/db-migration-${IMAGE_TAG}" -n "$NAMESPACE"
    
    log_success "Database migrations completed"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure components..."
    
    # Deploy PostgreSQL
    helm upgrade --install postgresql bitnami/postgresql \
        --namespace "$NAMESPACE" \
        --version "12.1.6" \
        --values "${HELM_CHART_PATH}/values/postgresql-values.yaml" \
        --wait
    
    # Deploy Redis
    helm upgrade --install redis bitnami/redis \
        --namespace "$NAMESPACE" \
        --version "17.6.0" \
        --values "${HELM_CHART_PATH}/values/redis-values.yaml" \
        --wait
    
    log_success "Infrastructure components deployed"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Update values with current image tag
    helm upgrade --install buddyhunt "$HELM_CHART_PATH" \
        --namespace "$NAMESPACE" \
        --set global.imageTag="$IMAGE_TAG" \
        --set global.environment="$ENVIRONMENT" \
        --values "${HELM_CHART_PATH}/values-${ENVIRONMENT}.yaml" \
        --wait \
        --timeout=600s
    
    log_success "Application deployed"
}

deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Add Prometheus Community Helm repository
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Deploy Prometheus
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values "${HELM_CHART_PATH}/values/prometheus-values.yaml" \
        --wait
    
    # Deploy custom dashboards
    kubectl apply -f "${HELM_CHART_PATH}/monitoring/dashboards/" -n monitoring
    
    log_success "Monitoring stack deployed"
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready --timeout=300s pod -l app=buddyhunt-api -n "$NAMESPACE"
    kubectl wait --for=condition=ready --timeout=300s pod -l app=buddyhunt-websocket -n "$NAMESPACE"
    
    # Get service URLs
    API_URL=$(kubectl get ingress buddyhunt-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}')
    
    # Test API health endpoint
    if curl -f "https://${API_URL}/health" > /dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        exit 1
    fi
    
    # Test WebSocket connection
    if timeout 10 bash -c "exec 3<>/dev/tcp/${API_URL}/443" 2>/dev/null; then
        log_success "WebSocket connection test passed"
    else
        log_error "WebSocket connection test failed"
        exit 1
    fi
    
    log_success "Smoke tests completed"
}

create_rollback_info() {
    log_info "Creating rollback information..."
    
    # Get current revision
    CURRENT_REVISION=$(helm list -n "$NAMESPACE" -o json | jq -r '.[] | select(.name=="buddyhunt") | .revision')
    
    # Store rollback info
    cat > "/tmp/buddyhunt-rollback-${IMAGE_TAG}.json" <<EOF
{
  "environment": "${ENVIRONMENT}",
  "namespace": "${NAMESPACE}",
  "revision": "${CURRENT_REVISION}",
  "image_tag": "${IMAGE_TAG}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "kubectl_context": "${KUBERNETES_CONTEXT}"
}
EOF
    
    log_info "Rollback info saved to /tmp/buddyhunt-rollback-${IMAGE_TAG}.json"
    log_info "To rollback, run: helm rollback buddyhunt $((CURRENT_REVISION - 1)) -n ${NAMESPACE}"
}

cleanup_old_resources() {
    log_info "Cleaning up old resources..."
    
    # Remove old completed jobs
    kubectl delete job -l app=buddyhunt --field-selector status.successful=1 -n "$NAMESPACE" || true
    
    # Remove old replica sets
    kubectl delete rs -l app=buddyhunt --field-selector 'metadata.creationTimestamp<'"$(date -d '7 days ago' -u +"%Y-%m-%dT%H:%M:%SZ")" -n "$NAMESPACE" || true
    
    log_success "Cleanup completed"
}

# Main deployment process
main() {
    log_info "Starting deployment for environment: $ENVIRONMENT"
    log_info "Image tag: $IMAGE_TAG"
    log_info "Namespace: $NAMESPACE"
    
    # Deployment steps
    check_prerequisites
    setup_secrets
    
    if [[ "${BUILD_IMAGES:-true}" == "true" ]]; then
        build_and_push_images
    fi
    
    deploy_infrastructure
    run_database_migrations
    deploy_application
    
    if [[ "${DEPLOY_MONITORING:-true}" == "true" ]]; then
        deploy_monitoring
    fi
    
    run_smoke_tests
    create_rollback_info
    cleanup_old_resources
    
    log_success "Deployment completed successfully!"
    
    # Display useful information
    echo ""
    echo "=== Deployment Information ==="
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo "Image Tag: $IMAGE_TAG"
    echo ""
    echo "=== Service URLs ==="
    kubectl get ingress -n "$NAMESPACE" -o custom-columns=NAME:.metadata.name,HOSTS:.spec.rules[*].host,PORTS:.spec.tls[*].secretName
    echo ""
    echo "=== Pod Status ==="
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance=buddyhunt
}

# Rollback function
rollback() {
    local revision="${1:-}"
    
    if [[ -z "$revision" ]]; then
        log_error "Please specify revision number for rollback"
        log_info "Usage: $0 rollback <revision_number>"
        log_info "Available revisions:"
        helm history buddyhunt -n "$NAMESPACE"
        exit 1
    fi
    
    log_info "Rolling back to revision $revision..."
    
    helm rollback buddyhunt "$revision" -n "$NAMESPACE" --wait
    
    log_success "Rollback completed successfully!"
    
    # Run smoke tests after rollback
    run_smoke_tests
}

# Script entry point
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback "${2:-}"
        ;;
    "test")
        run_smoke_tests
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|test}"
        echo "  deploy   - Deploy the application"
        echo "  rollback - Rollback to a previous revision"
        echo "  test     - Run smoke tests only"
        exit 1
        ;;
esac