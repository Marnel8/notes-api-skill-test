# Notes API

A RESTful Notes API built with NestJS, featuring Google OAuth authentication, MongoDB storage, and JWT-based authorization.

## Prerequisites

- Node.js (v18+)
- npm (v9+)
- MongoDB (local or MongoDB Atlas)
- Google Cloud Platform account

## Setup

### Install Dependencies

```bash
npm install
```

### Create `.env` File

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/notes-api
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Identity API (APIs & Services > Library)
4. Configure OAuth consent screen (choose "External", fill in app name and email)
5. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Create Credentials > OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

## Running the Application

```bash
npm run start:dev
```

API will be available at `http://localhost:3000/api`

## API Documentation

API documentation is in `api-docs.http`. Install the REST Client extension in VS Code to use it, or import to Postman.

## Testing

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

## API Endpoints

**Authentication:**

- `GET /api/auth/google` - Get OAuth URL
- `POST /api/auth/google/callback` - Exchange code for JWT
- `POST /api/auth/validate` - Validate token
- `GET /api/auth/profile` - Get user profile

**Notes (Authenticated):**

- `POST /api/notes` - Create note
- `GET /api/notes` - List notes (with pagination/filters)
- `GET /api/notes/:id` - Get note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

**Users (Admin only):**

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id/make-admin` - Promote to admin
- `PUT /api/users/:id/make-regular` - Demote to regular
- `DELETE /api/users/:id` - Delete user
