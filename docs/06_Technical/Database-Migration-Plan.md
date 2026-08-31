# Database Migration Plan

## Objective

Align current MVP database with the target domain model.

## Current State

Current tables:

- shows
- reservations

## Target State

New entities:

- shows
- performances
- venues
- customers
- reservations
- tickets
- checkins
- notifications
- audit_logs

## Migration Approach

1. Create new tables
2. Migrate existing show records
3. Convert old show records into performances
4. Extract customers from reservations
5. Generate ticket records
6. Validate migrated data
