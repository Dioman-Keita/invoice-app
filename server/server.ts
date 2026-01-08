import app from './app';
import logger from './utils/Logger';
import { DBLogger } from './utils/DBLogger';
import { startCleanupUnverifiedJob } from './jobs/cleanupUnverified';
import { startCleanupLogsJob } from './jobs/cleanupLogs';

// Configure logger to persist errors in database
logger.setDBLogger(DBLogger.log);

const PORT = process.env.PORT || 3000;

// Asynchronous initialization
async function startServer() {
    try {

        // Start the server
        app.listen(Number(PORT), '127.0.0.1', () => {
            logger.info(`🚀 Server started on port ${PORT}`);
            logger.info(`📡 API available at http://127.0.0.1:${PORT}/api`);
            logger.info(`🔍 Health check: http://127.0.0.1:${PORT}/api/health`);
            console.log(`🚀 Server started on port ${PORT}`);
            console.log(`📡 API available at http://127.0.0.1:${PORT}/api`);
            console.log(`🔍 Health check: http://127.0.0.1:${PORT}/api/health`);
            startCleanupUnverifiedJob();
            startCleanupLogsJob();
        });
    } catch (error) {
        logger.error('✗ Server initialization failed', { error });
        console.error('✗ Server initialization failed:', error);
        process.exit(1);
    }
}

// Cleanup on shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, cleaning up...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, cleaning up...');
    process.exit(0);
});

// Start the server
startServer();

export default app;
