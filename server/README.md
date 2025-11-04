# imadio autopost - Backend Server

Backend API server for imadio autopost, an X (Twitter) scheduling application.

## Features

- **User Authentication**: JWT-based authentication
- **X OAuth 2.0**: Real X (Twitter) account integration
- **Post Scheduling**: Schedule posts with date and time
- **Thread Support**: Post threads (multiple connected tweets)
- **Multi-Account**: Post to multiple X accounts simultaneously
- **Auto-Retry**: Automatic retry on failed posts
- **Bulk Controls**: Pause all scheduled posts at once
- **Settings Management**: Timezone, notifications, retry settings

## Tech Stack

- **Node.js** with **TypeScript**
- **Express** - Web framework
- **SQLite** (better-sqlite3) - Database
- **twitter-api-v2** - X API integration
- **node-cron** - Scheduling engine
- **JWT** - Authentication
- **bcrypt** - Password hashing

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Get X API Credentials

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Enable OAuth 2.0 authentication
4. Set callback URL to: `http://localhost:3001/api/auth/x/callback`
5. Get your **Client ID** and **Client Secret**
6. Add them to your `.env` file

Required OAuth 2.0 scopes:
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access` (for refresh tokens)

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### X Account Integration

- `GET /api/auth/x/initiate` - Start X OAuth flow (requires auth)
- `GET /api/auth/x/callback` - OAuth callback (called by X)
- `GET /api/x-accounts` - Get all connected X accounts (requires auth)
- `PUT /api/x-accounts/:accountId/disconnect` - Disconnect account (requires auth)
- `DELETE /api/x-accounts/:accountId` - Delete account (requires auth)
- `PUT /api/x-accounts/:accountId/type` - Update account type (requires auth)

### Posts

- `POST /api/posts` - Create scheduled post (requires auth)
- `GET /api/posts` - Get all posts (requires auth)
- `GET /api/posts/:postId` - Get single post (requires auth)
- `PUT /api/posts/:postId` - Update post (requires auth)
- `DELETE /api/posts/:postId` - Delete post (requires auth)

### Settings

- `GET /api/settings` - Get user settings (requires auth)
- `PUT /api/settings` - Update settings (requires auth)

### Health Check

- `GET /api/health` - Server health check

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get the token by registering or logging in.

## Database Schema

The application uses SQLite with the following tables:

- **users** - User accounts
- **x_accounts** - Connected X accounts with OAuth tokens
- **posts** - Scheduled posts
- **post_images** - Images associated with posts
- **post_accounts** - Junction table for posts and accounts (many-to-many)
- **settings** - User settings

## Scheduler

The scheduler runs every minute and:

1. Checks for posts scheduled for current time or earlier
2. Posts to all selected X accounts
3. Handles failures with automatic retry
4. Respects bulk pause setting
5. Updates post status (scheduled → posting → posted/failed)

## Development

```bash
# Start development server with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

## Environment Variables

See `.env.example` for all available configuration options.

## Security Notes

- Change `JWT_SECRET` to a strong random string in production
- Never commit `.env` file to version control
- Use HTTPS in production
- Rotate X API tokens regularly
- Enable CORS only for your frontend domain in production

## Troubleshooting

### "X API credentials not found"
Make sure you've set `X_API_CLIENT_ID` and `X_API_CLIENT_SECRET` in `.env`

### "Database error"
Delete the `data/` directory and restart the server to recreate the database

### "OAuth callback failed"
- Verify callback URL matches in X Developer Portal and `.env`
- Check that OAuth 2.0 is enabled in X app settings
- Ensure all required scopes are selected

## License

ISC
