const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const env = require('../config/env');

const paths = require('./swaggerPaths');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Collection Agent and Accountability System API',
    version: '1.1.0',
    description: `Production REST API for managing collection agents, supervisors, customers, loan recovery visits, payment collections, and team accountability.
    
### Role Overview
- **ADMIN**: Complete system administrative access. User & profile provisioning, branch management, master reports.
- **SUPERVISOR**: Manages a team of collection field agents, monitors collection visits, confirms payments, views team reports.
- **FIELD_AGENT**: Records customer collection visits, logs payment receipts, views assigned customer queue.
`,
    contact: {
      name: 'System Architecture Team',
      email: 'admin@collectagent.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'API v1 Base Endpoint'
    },
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Server Root (Health Checks)'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Bearer access token received from /auth/login or /auth/refresh'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token missing, expired, or invalid',
        content: {
          'application/json': {
            example: {
              success: false,
              message: 'Invalid authentication token',
              error: { code: 'INVALID_TOKEN', details: [] }
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access denied: Role or ownership restrictions violated',
        content: {
          'application/json': {
            example: {
              success: false,
              message: 'Access denied. Role is not authorized to perform this action.',
              error: { code: 'FORBIDDEN', details: [] }
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid request body or parameters',
        content: {
          'application/json': {
            example: {
              success: false,
              message: 'Validation failed for one or more fields',
              error: {
                code: 'VALIDATION_ERROR',
                details: [{ field: 'email', message: 'Invalid email address' }]
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths
};

const options = {
  swaggerDefinition,
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Collection Agent System API Docs'
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = {
  setupSwagger,
  swaggerSpec
};
