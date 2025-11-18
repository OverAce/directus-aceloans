# Directus Configuration for Kiron Data Applications

This repository contains the Directus configuration and setup for the Kiron data applications.

## Overview

Directus is used as a headless CMS and API platform for managing data in the Kiron ecosystem.

## Quick Start

1. Copy `.env.example` to `.env.local` and configure your environment variables
2. Run the Docker Compose setup:
   ```bash
   docker-compose up -d
   ```
3. Access Directus at http://localhost:8055

## Structure

- `docker-compose.yml` - Docker Compose configuration
- `extensions/` - Custom Directus extensions
- `uploads/` - File uploads storage
- `database/` - Database files (if using SQLite)

## Configuration

The main configuration is handled through environment variables in `.env.local`.

## Development

This repository is a submodule of the main [db-schema](https://github.com/KironPartner/db-schema) project.
