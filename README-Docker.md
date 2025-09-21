# Users Service Docker Setup

This directory contains the Docker configuration for the Users microservice with PostgreSQL database.

## Services

### 1. Users Service
- **Container**: `users-service`
- **Port**: 3000
- **Technology**: Node.js + TypeScript + Express

### 2. PostgreSQL Database
- **Container**: `users-db`
- **Port**: 5432
- **Database**: `users_db`
- **Username**: `users_admin`
- **Password**: `secure_password_123`

### 3. pgAdmin (Optional)
- **Container**: `users-pgadmin`
- **Port**: 8080
- **Email**: `admin@toouk.com`
- **Password**: `admin123`

## Database Configuration

The PostgreSQL user `users_admin` has been granted **ALL PRIVILEGES** on:
- The `users_db` database
- All tables, sequences, and functions in the public schema
- Future objects created in the database

## Quick Start

1. **Build and start services:**
   ```bash
   docker-compose up --build
   ```

2. **Start in detached mode:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f users-service
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes:**
   ```bash
   docker-compose down -v
   ```

## Environment Variables

Copy `.env.example` to `.env` and modify as needed:
```bash
cp .env.example .env
```

## Database Access

### From Application
```
DATABASE_URL=postgresql://users_admin:secure_password_123@users-db:5432/users_db?schema=public
```

### From Host Machine
```
Host: localhost
Port: 5432
Database: users_db
Username: users_admin
Password: secure_password_123
```

### Via pgAdmin
1. Open http://localhost:8080
2. Login with admin@toouk.com / admin123
3. Add new server:
   - Name: Users DB
   - Host: users-db
   - Port: 5432
   - Database: users_db
   - Username: users_admin
   - Password: secure_password_123

## Health Checks

- **Application**: http://localhost:3000/health
- **Database**: Automatically checked via pg_isready

## Development

### Local Development with Docker Database
```bash
# Start only the database
docker-compose up users-db -d

# Run the application locally
npm run dev
```

### Rebuild Application Container
```bash
docker-compose up --build users-service
```

## Volumes

- `users_db_data`: PostgreSQL data persistence
- `pgadmin_data`: pgAdmin configuration persistence
- `./logs`: Application logs (mounted from host)

## Network

All services communicate via the `users-network` bridge network.

## Security Notes

- Change default passwords in production
- Use secrets management for sensitive data
- The database user has full privileges - restrict in production if needed
- Consider using read-only users for application queries
