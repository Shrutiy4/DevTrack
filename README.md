# DevTrack – Issue & Bug Tracking Backend System

![Java 21](https://img.shields.io/badge/Java-21-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.0-brightgreen.svg)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue.svg)
![JWT](https://img.shields.io/badge/Security-JWT-blueviolet.svg)

DevTrack is a robust, enterprise-grade RESTful API built to handle issue and bug tracking, similar to Jira or GitHub Issues. It is designed to demonstrate clean architecture, secure authentication, and standard enterprise patterns using the latest Java and Spring ecosystem.

## Features

- **JWT Authentication & Authorization**: Secure role-based access control (USER, ADMIN).
- **Issue Lifecycle Management**: Full CRUD operations with realistic status flows (OPEN -> IN_PROGRESS -> TESTING -> RESOLVED -> CLOSED).
- **Commenting System**: Users can discuss issues directly within the ticket.
- **Activity Logging (Audit Trail)**: The system automatically tracks critical changes, such as status updates and re-assignments, ensuring full accountability.
- **Advanced Filtering & Pagination**: Optimized database queries for high performance when handling large datasets.

## Architecture & Best Practices Demonstrated

- **N-Tier Architecture**: Clear separation of concerns (Controller, Service, Repository, Entity, DTO).
- **DTO Pattern**: Preventing internal database entity structures from bleeding into the API layer.
- **Global Exception Handling**: Consistent API error responses using `@RestControllerAdvice`.
- **Constructor Injection**: Using `final` fields and Lombok for immutable, testable dependency injection.
- **SOLID Principles**: Focused, single-responsibility services.

## Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 3.3.0
- **Security**: Spring Security + JWT (JSON Web Tokens)
- **Database**: MySQL 8+
- **ORM**: Spring Data JPA / Hibernate
- **Build Tool**: Maven

## Getting Started

### Prerequisites
- JDK 21 installed
- MySQL Server installed and running locally
- Maven installed

### Database Setup
1. Open your MySQL client and create a new database:
   ```sql
   CREATE DATABASE devtrack_db;
   ```
2. Update the `src/main/resources/application.yml` file with your MySQL root password:
   ```yaml
   spring:
     datasource:
       username: root
       password: your_actual_password_here
   ```

### Running the Application
1. Clone the repository and navigate to the root directory.
2. Build the project:
   ```bash
   mvn clean install
   ```
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```
The server will start on `http://localhost:8080`. Hibernate will automatically generate all necessary database tables on the first run.

## API Documentation

*(Please refer to the Postman Guide for full request/response payloads and testing flows)*

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Authenticate and get JWT

### Issues
- `POST /api/v1/issues` - Create an issue
- `GET /api/v1/issues` - Get all issues (Supports Pagination)
- `GET /api/v1/issues/{id}` - Get issue by ID
- `PATCH /api/v1/issues/{id}/status` - Change issue status
- `PATCH /api/v1/issues/{id}/assign/{userId}` - Assign issue to a user
- `DELETE /api/v1/issues/{id}` - Delete an issue (Admin only)

### Comments
- `POST /api/v1/issues/{id}/comments` - Add a comment
- `GET /api/v1/issues/{id}/comments` - Get all comments for an issue

### Activity Logs
- `GET /api/v1/issues/{id}/logs` - View the history/audit trail of an issue

---
*Built as a portfolio project to demonstrate backend engineering fundamentals.*
