const app = require('./app');
const env = require('./config/env');
const { sequelize, checkDatabaseConnection } = require('./config/database');

let server;

const startServer = async () => {
  try {
    console.log('[Bootstrap] Initializing Collection Agent System Backend...');
    
    // Check database connection before accepting any requests
    await checkDatabaseConnection();

    server = app.listen(env.PORT, () => {
      console.log(`[Server] Server listening on port ${env.PORT} in '${env.NODE_ENV}' mode`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/health`);
      console.log(`[Server] Readiness check: http://localhost:${env.PORT}/health/ready`);
      console.log(`[Server] API Base: http://localhost:${env.PORT}${env.API_PREFIX}`);
    });

  } catch (error) {
    console.error('[Bootstrap] Failed to initialize server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await sequelize.close();
        console.log('[Database] Database connection pool closed.');
        process.exit(0);
      } catch (err) {
        console.error('[Database] Error closing database connection:', err);
        process.exit(1);
      }
    });

    // Force close if graceful shutdown takes longer than 10s
    setTimeout(() => {
      console.error('[Server] Forceful shutdown initiated after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
