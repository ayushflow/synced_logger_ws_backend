# Synced Logger Backend

This project implements a WebSocket server for receiving and processing log messages from clients. The logs are batched and written to a file periodically.

## Features

- WebSocket server for real-time log collection
- Batching and periodic writing of logs to a file
- Graceful shutdown handling

## Setup

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd synced_logger_backend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set the environment variable for the server port (optional):
    ```sh
    export PORT=8080
    ```

4. Start the server:
    ```sh
    node index.js
    ```

## Usage

- The server listens for WebSocket connections on the specified port (default is 8080).
- Clients can send log messages in JSON format. Each message should contain an array of logs:
    ```json
    {
        "logs": [
            { "id": "log1", "message": "This is a log message" },
            { "id": "log2", "message": "This is another log message" }
        ]
    }
    ```
- The server will respond with a success message containing the log IDs if the format is correct:
    ```json
    {
        "status": "success",
        "logIds": ["log1", "log2"]
    }
    ```
- If the format is invalid, the server will respond with an error message:
    ```json
    {
        "status": "error",
        "message": "Invalid format"
    }
    ```

## Graceful Shutdown

- The server handles `SIGINT` for graceful shutdown.
- Any remaining logs are written to the file before the server shuts down.
- All WebSocket connections are closed during the shutdown process.
