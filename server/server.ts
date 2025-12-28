import app from './app';
import logger from './utils/Logger';
import { DBLogger } from './utils/DBLogger';
import { startCleanupUnverifiedJob } from './jobs/cleanupUnverified';
import { startCleanupLogsJob } from './jobs/cleanupLogs';

// Configuration du logger pour persister les erreurs en DB
logger.setDBLogger(DBLogger.log);

const PORT = process.env.PORT || 3000;

// Initialisation asynchrone
async function startServer() {
    try {

        // Démarrer le serveur
        app.listen(Number(PORT), '127.0.0.1', () => {
            logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
            logger.info(`📡 API disponible sur http://127.0.0.1:${PORT}/api`);
            logger.info(`🔍 Health check: http://127.0.0.1:${PORT}/api/health`);
            console.log(`🚀 Serveur démarré sur le port ${PORT}`);
            console.log(`📡 API disponible sur http://127.0.0.1:${PORT}/api`);
            console.log(`🔍 Health check: http://127.0.0.1:${PORT}/api/health`);
            startCleanupUnverifiedJob();
            startCleanupLogsJob();
        });
    } catch (error) {
        logger.error('✗ Échec de l\'initialisation du serveur', { error });
        console.error('✗ Échec de l\'initialisation du serveur:', error);
        process.exit(1);
    }
}

// Nettoyage lors de l'arrêt
process.on('SIGTERM', async () => {
    logger.info('SIGTERM reçu, nettoyage...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT reçu, nettoyage...');
    process.exit(0);
});

// Démarrer le serveur
startServer();

export default app;
