const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Vendor & PO Manager API',
            version: '2.0.0',
            description: 'Enterprise SaaS API for managing vendors, purchase orders, invoices, and more.',
            contact: { name: 'API Support' },
        },
        servers: [
            { url: '/api', description: 'API Server' },
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
                Vendor: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        contactPerson: { type: 'string' },
                        phone: { type: 'string' },
                        email: { type: 'string' },
                        address: { type: 'string' },
                        gstTaxId: { type: 'string' },
                        rating: { type: 'number' },
                        performanceScore: { type: 'number' },
                        riskIndex: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                    },
                },
                PurchaseOrder: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        poNumber: { type: 'string' },
                        vendor: { type: 'string' },
                        items: { type: 'array' },
                        totalAmount: { type: 'number' },
                        status: { type: 'string', enum: ['Pending', 'Delivered', 'Cancelled'] },
                        approvalStatus: { type: 'string', enum: ['Draft', 'Submitted', 'Approved', 'Rejected'] },
                        department: { type: 'string' },
                    },
                },
                Invoice: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        invoiceNumber: { type: 'string' },
                        amount: { type: 'number' },
                        paidAmount: { type: 'number' },
                        outstandingAmount: { type: 'number' },
                        paymentStatus: { type: 'string', enum: ['Unpaid', 'Partial', 'Paid'] },
                    },
                },
                AuditLog: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        action: { type: 'string' },
                        entityType: { type: 'string' },
                        entityId: { type: 'string' },
                        metadata: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
