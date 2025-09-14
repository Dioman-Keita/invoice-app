import app from './app';
import logger from './utils/Logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
    logger.info(`📡 API disponible sur http://localhost:${PORT}/api`);
    logger.info(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
