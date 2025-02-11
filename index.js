const WebSocket = require('ws');
const fs = require('fs').promises;

class LogServer {
    constructor() {
        this.port = process.env.PORT || 8080;
        this.pendingLogs = [];
        this.writeTimer = null;
        this.initServer();
    }

    initServer() {
        this.wss = new WebSocket.Server({ port: this.port }, () => {
            console.log(`WebSocket server running on ws://localhost:${this.port}`);
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            this.shutdown();
        });
    }

    handleConnection(ws) {
        console.log('Client connected');

        ws.on('message', (message) => this.handleMessage(ws, message));
        ws.on('close', () => console.log('Client disconnected'));
    }

    async handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            if (!data.logs || !Array.isArray(data.logs)) {
                throw new Error('Invalid log format');
            }

            // Add timestamp to logs
            const processedLogs = data.logs.map(log => ({
                ...log,
                timestamp: new Date().toISOString()
            }));

            // Add to batch for writing
            this.addToBatch(processedLogs);

            // Send success response
            ws.send(JSON.stringify({
                status: 'success',
                logIds: processedLogs.map(log => log.id)
            }));

        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                status: 'error',
                message: 'Invalid format'
            }));
        }
    }

    addToBatch(logs) {
        this.pendingLogs.push(...logs);

        // Clear existing timer if any
        if (this.writeTimer) {
            clearTimeout(this.writeTimer);
        }

        // Set new timer to write logs
        this.writeTimer = setTimeout(() => this.flushBatch(), 5000);
    }

    async flushBatch() {
        if (this.pendingLogs.length === 0) return;

        const logsToWrite = this.pendingLogs;
        this.pendingLogs = [];
        
        try {
            const logText = logsToWrite
                .map(log => JSON.stringify(log))
                .join('\n') + '\n';
                
            await fs.appendFile('server_logs.txt', logText);
            console.log(`Wrote ${logsToWrite.length} logs to file`);
        } catch (error) {
            console.error('Error writing logs to file:', error);
            // Put logs back in queue
            this.pendingLogs.unshift(...logsToWrite);
        }
    }

    async shutdown() {
        console.log('Shutting down server...');
        
        // Write any remaining logs
        await this.flushBatch();
        
        // Close all connections
        this.wss.clients.forEach(client => {
            client.close();
        });
        
        this.wss.close(() => {
            console.log('Server shutdown complete');
            process.exit(0);
        });
    }
}

// Start the server
new LogServer();