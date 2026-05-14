import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fix-ISO API',
      version: '1.0.0',
      description: 'API REST para Fix-ISO — Gestión ISO 27001:2022',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Servidor local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@fixiso.com' },
            password: { type: 'string', format: 'password', example: 'Admin1234!' },
          },
        },
        RefreshBody: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: { '200': { description: 'Server running' } },
        },
      },

      // ── Auth ────────────────────────────────────────────────────────────────
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
          },
          responses: {
            '200': { description: 'Access + refresh token' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh tokens',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshBody' } } },
          },
          responses: { '200': { description: 'New tokens' } },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshBody' } } },
          },
          responses: { '200': { description: 'Logged out' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Current user',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'User data' }, '401': { description: 'Unauthorized' } },
        },
      },

      // ── Companies ────────────────────────────────────────────────────────────
      '/api/companies': {
        get: {
          tags: ['Companies'],
          summary: 'List companies',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Array of companies' } },
        },
        post: {
          tags: ['Companies'],
          summary: 'Create company',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Company created' } },
        },
      },
      '/api/companies/{id}': {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Companies'],
          summary: 'Get company by ID',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Company detail' }, '404': { description: 'Not found' } },
        },
        put: {
          tags: ['Companies'],
          summary: 'Update company',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Companies'],
          summary: 'Delete company',
          security: [{ bearerAuth: [] }],
          responses: { '204': { description: 'Deleted' } },
        },
      },
      '/api/companies/{id}/users': {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Companies'],
          summary: 'List users assigned to company',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Array of users' } },
        },
        post: {
          tags: ['Companies'],
          summary: 'Assign user to company',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'User assigned' } },
        },
      },
      '/api/companies/{id}/users/{userId}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        delete: {
          tags: ['Companies'],
          summary: 'Remove user from company',
          security: [{ bearerAuth: [] }],
          responses: { '204': { description: 'Removed' } },
        },
      },

      // ── Controls ─────────────────────────────────────────────────────────────
      '/api/controls': {
        get: {
          tags: ['Controls'],
          summary: 'List ISO 27001 control catalog',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'themeId', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'Paginated controls' } },
        },
      },
      '/api/controls/themes': {
        get: {
          tags: ['Controls'],
          summary: 'List ISO 27001 themes',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Array of themes' } },
        },
      },
      '/api/controls/{id}': {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Controls'],
          summary: 'Get control detail',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Control detail' } },
        },
        put: {
          tags: ['Controls'],
          summary: 'Update catalog control (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        },
      },
      '/api/companies/{companyId}/controls': {
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Company Controls'],
          summary: 'List controls assigned to company',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Controls list' } },
        },
        post: {
          tags: ['Company Controls'],
          summary: 'Assign control to company',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Control assigned' } },
        },
      },
      '/api/companies/{companyId}/controls/{controlId}': {
        parameters: [
          { name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'controlId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        put: {
          tags: ['Company Controls'],
          summary: 'Update control assignment',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Company Controls'],
          summary: 'Remove control from company',
          security: [{ bearerAuth: [] }],
          responses: { '204': { description: 'Removed' } },
        },
      },
      '/api/companies/{companyId}/soa': {
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Company Controls'],
          summary: 'Statement of Applicability',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'SoA entries' } },
        },
      },
      '/api/companies/{companyId}/soa/{controlId}': {
        parameters: [
          { name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'controlId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        put: {
          tags: ['Company Controls'],
          summary: 'Update SoA entry',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        },
      },

      // ── Assets ───────────────────────────────────────────────────────────────
      '/api/companies/{companyId}/assets': {
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Assets'],
          summary: 'List assets of a company',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Assets list' } },
        },
        post: {
          tags: ['Assets'],
          summary: 'Create asset',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Asset created' } },
        },
      },
      '/api/companies/{companyId}/assets/{assetId}': {
        parameters: [
          { name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'assetId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        get: {
          tags: ['Assets'],
          summary: 'Get asset detail with risks',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Asset with risk assessments' } },
        },
        put: {
          tags: ['Assets'],
          summary: 'Update asset',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Assets'],
          summary: 'Delete asset',
          security: [{ bearerAuth: [] }],
          responses: { '204': { description: 'Deleted' } },
        },
      },
      '/api/companies/{companyId}/assets/{assetId}/risks': {
        parameters: [
          { name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'assetId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        post: {
          tags: ['Assets'],
          summary: 'Create risk assessment for asset',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Risk created' } },
        },
      },

      // ── Dashboard ────────────────────────────────────────────────────────────
      '/api/dashboard/stats': {
        get: {
          tags: ['Dashboard'],
          summary: 'Global stats',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Stats object' } },
        },
      },
      '/api/dashboard/compliance-by-theme': {
        get: {
          tags: ['Dashboard'],
          summary: 'Compliance by ISO theme',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Compliance array' } },
        },
      },
      '/api/dashboard/companies/{companyId}/stats': {
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Dashboard'],
          summary: 'Stats for a specific company',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Company stats' } },
        },
      },

      // ── Users ────────────────────────────────────────────────────────────────
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'List system users',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Users list' } },
        },
        post: {
          tags: ['Users'],
          summary: 'Create user',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'User created' } },
        },
      },
      '/api/users/{id}': {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'User detail' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user',
          security: [{ bearerAuth: [] }],
          responses: { '204': { description: 'Deleted' } },
        },
      },

      // ── Audits ───────────────────────────────────────────────────────────────
      '/api/companies/{companyId}/audits': {
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Audits'],
          summary: 'List audits for company',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Audits list' } },
        },
        post: {
          tags: ['Audits'],
          summary: 'Create audit',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Audit created' } },
        },
      },

      // ── Implementation ───────────────────────────────────────────────────────
      '/api/companies/{companyId}/implementation': {
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Implementation'],
          summary: 'List implementation tasks',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Tasks list' } },
        },
        post: {
          tags: ['Implementation'],
          summary: 'Create implementation task',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Task created' } },
        },
      },

      // ── Trainings ────────────────────────────────────────────────────────────
      '/api/companies/{companyId}/trainings': {
        parameters: [{ name: 'companyId', in: 'path', required: true, schema: { type: 'integer' } }],
        get: {
          tags: ['Trainings'],
          summary: 'List trainings for company',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Trainings list' } },
        },
        post: {
          tags: ['Trainings'],
          summary: 'Create training',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Training created' } },
        },
      },

      // ── Documents ────────────────────────────────────────────────────────────
      '/api/documents': {
        get: {
          tags: ['Documents'],
          summary: 'List documents',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Documents list' } },
        },
        post: {
          tags: ['Documents'],
          summary: 'Upload document',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
          },
          responses: { '201': { description: 'Document uploaded' } },
        },
      },

      // ── Reports ──────────────────────────────────────────────────────────────
      '/api/reports/compliance': {
        get: {
          tags: ['Reports'],
          summary: 'Compliance report',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf', 'excel'] } }],
          responses: { '200': { description: 'Report data or file download' } },
        },
      },

      // ── Catalogs ─────────────────────────────────────────────────────────────
      '/api/catalogs/sectors': {
        get: {
          tags: ['Catalogs'],
          summary: 'List industry sectors',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Sectors list' } },
        },
      },
      '/api/catalogs/sizes': {
        get: {
          tags: ['Catalogs'],
          summary: 'List company sizes',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Sizes list' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
