#!/usr/bin/env bash
# Pull the default local models. Use `docker compose exec ollama ollama pull ...` if Ollama runs in Docker.
set -e
ollama pull qwen3:8b
ollama pull qwen3:4b
ollama pull nomic-embed-text
