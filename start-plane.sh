#!/bin/bash
# Script para iniciar Plane com Docker

echo "🚀 Iniciando Plane via Docker..."
echo ""

cd "$(dirname "$0")"

# Parar containers antigos (sem erro se não existirem)
echo "⏹️  Parando containers antigos..."
docker-compose -f docker-compose.yml down 2>/dev/null || true

echo ""
echo "🏗️  Construindo e iniciando containers..."
echo "Isso pode levar alguns minutos na primeira vez..."
echo ""

# Iniciar em background
docker-compose -f docker-compose.yml up -d

echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 10

echo ""
echo "📋 Status dos containers:"
docker-compose -f docker-compose.yml ps

echo ""
echo "✅ Plane iniciado!"
echo ""
echo "Acessar em:"
echo "  🌐 App Principal:    http://localhost:8000"
echo "  ⚙️  God Mode (Admin): http://localhost:3001/god-mode"
echo ""
echo "Visualizar logs:"
echo "  docker-compose logs -f api      # Backend API"
echo "  docker-compose logs -f web      # Frontend"
echo "  docker-compose logs -f admin    # God Mode"
echo ""
