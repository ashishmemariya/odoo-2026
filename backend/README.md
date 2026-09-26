# StockSense Backend

Node.js + Express + MongoDB backend for the StockSense Inventory Management System.

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally or a remote connection URI

## Setup

1. Install dependencies (from the project root):

   ```bash
   npm install
   ```

2. Create a `.env` file in `backend/` (copy from `.env.example`):

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Update `MONGO_URI` in `.env` if your MongoDB instance differs from the default.

## Run

From the project root:

```bash
npm run dev:backend
```

Or from the `backend/` directory:

```bash
npm run dev
```

## API

| Method | Endpoint       | Description  |
| ------ | -------------- | ------------ |
| GET    | `/api/health`  | Health check |

## Environment Variables

| Variable     | Description              | Default                                  |
| ------------ | ------------------------ | ---------------------------------------- |
| `PORT`       | Server port              | `5000`                                   |
| `MONGO_URI`  | MongoDB connection URI   | `mongodb://localhost:27017/stocksense`   |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173`                  |
