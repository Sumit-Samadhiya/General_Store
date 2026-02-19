# General Store Backend API

A Node.js backend API built with Express.js for the General Store application.

## Project Structure

```
Server/
├── src/
│   ├── config/          # Configuration files (database, environment)
│   ├── models/          # Database models
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication, validation, error handling
│   ├── utils/           # Helper functions
│   └── server.js        # Main server file
├── package.json         # Project dependencies
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (optional, for database operations)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration values.

## Running the Server

### Development mode (with hot reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 5000).

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Environment Variables

See `.env.example` for all available configuration options.

## Dependencies

- **express** - Web framework
- **dotenv** - Environment variables
- **cors** - Cross-Origin Resource Sharing
- **mongoose** - MongoDB ODM
- **joi** - Schema validation
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

## Development Dependencies

- **nodemon** - Auto-reload development server
- **jest** - Testing framework

## Contributing

[Add contribution guidelines here]

## License

ISC
