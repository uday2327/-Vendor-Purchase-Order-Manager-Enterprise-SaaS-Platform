const Invoice = require('../models/Invoice');
const multer = require('multer');
const path = require('path');

// Multer config for invoice file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, `invoice-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|png|jpg|jpeg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        if (ext) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// @desc    Get all invoices
// @route   GET /api/invoices
const getInvoices = async (req, res) => {
    try {
        const { paymentStatus, vendor, page = 1, limit = 10 } = req.query;
        const query = {};

        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (vendor) query.vendor = vendor;

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .populate('purchaseOrder', 'poNumber totalAmount')
            .populate('vendor', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            invoices,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('purchaseOrder', 'poNumber totalAmount status')
            .populate('vendor', 'name email phone');
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create invoice
// @route   POST /api/invoices
const createInvoice = async (req, res) => {
    try {
        const invoice = new Invoice(req.body);
        await invoice.save();
        const populated = await invoice.populate([
            { path: 'purchaseOrder', select: 'poNumber totalAmount' },
            { path: 'vendor', select: 'name email' },
        ]);
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
const updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        Object.assign(invoice, req.body);
        await invoice.save();
        const populated = await invoice.populate([
            { path: 'purchaseOrder', select: 'poNumber totalAmount' },
            { path: 'vendor', select: 'name email' },
        ]);
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload invoice file
// @route   POST /api/invoices/:id/upload
const uploadInvoiceFile = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        invoice.invoiceFile = `/uploads/${req.file.filename}`;
        await invoice.save();
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record payment
// @route   PUT /api/invoices/:id/pay
const recordPayment = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid payment amount is required' });
        }

        invoice.paidAmount = invoice.paidAmount + amount;
        await invoice.save();

        const populated = await invoice.populate([
            { path: 'purchaseOrder', select: 'poNumber totalAmount' },
            { path: 'vendor', select: 'name email' },
        ]);
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    uploadInvoiceFile,
    recordPayment,
    upload,
};
