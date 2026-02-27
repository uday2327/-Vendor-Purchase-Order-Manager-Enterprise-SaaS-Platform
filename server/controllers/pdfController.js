const PDFDocument = require('pdfkit');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');

// Generate PO PDF
const generatePOPdf = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id).populate('vendor', 'name email phone address gstTaxId').lean();
        if (!po) return res.status(404).json({ message: 'PO not found' });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${po.poNumber}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').fillColor('#64748b').text(po.poNumber, { align: 'center' });
        doc.moveDown();

        // Vendor info
        doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('Vendor:');
        doc.font('Helvetica').text(po.vendor?.name || 'N/A');
        doc.text(po.vendor?.email || '');
        doc.text(po.vendor?.phone || '');
        doc.text(po.vendor?.address || '');
        if (po.vendor?.gstTaxId) doc.text(`GST: ${po.vendor.gstTaxId}`);
        doc.moveDown();

        // Dates
        doc.font('Helvetica-Bold').text(`Order Date: `, { continued: true }).font('Helvetica').text(new Date(po.orderDate).toLocaleDateString());
        doc.font('Helvetica-Bold').text(`Expected Delivery: `, { continued: true }).font('Helvetica').text(new Date(po.expectedDeliveryDate).toLocaleDateString());
        doc.font('Helvetica-Bold').text(`Status: `, { continued: true }).font('Helvetica').text(po.status);
        doc.font('Helvetica-Bold').text(`Department: `, { continued: true }).font('Helvetica').text(po.department || 'General');
        doc.moveDown();

        // Items table
        doc.font('Helvetica-Bold').text('Items:', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', 50, tableTop).text('Qty', 250, tableTop).text('Unit Price', 320, tableTop).text('Total', 430, tableTop);
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();

        doc.font('Helvetica');
        let y = doc.y + 10;
        for (const item of po.items) {
            doc.text(item.name, 50, y).text(String(item.qty), 250, y).text(`₹${item.unitPrice.toLocaleString()}`, 320, y).text(`₹${item.total.toLocaleString()}`, 430, y);
            y += 20;
        }

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;
        doc.font('Helvetica-Bold').fontSize(12).text(`Total: ₹${po.totalAmount.toLocaleString()}`, 370, y);

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generate Invoice PDF
const generateInvoicePdf = async (req, res) => {
    try {
        const inv = await Invoice.findById(req.params.id)
            .populate('vendor', 'name email phone address gstTaxId')
            .populate('purchaseOrder', 'poNumber')
            .lean();
        if (!inv) return res.status(404).json({ message: 'Invoice not found' });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${inv.invoiceNumber}.pdf`);
        doc.pipe(res);

        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').fillColor('#64748b').text(inv.invoiceNumber, { align: 'center' });
        doc.moveDown();

        doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('Vendor:');
        doc.font('Helvetica').text(inv.vendor?.name || 'N/A');
        doc.text(inv.vendor?.email || '');
        doc.moveDown();

        doc.font('Helvetica-Bold').text(`PO Number: `, { continued: true }).font('Helvetica').text(inv.purchaseOrder?.poNumber || 'N/A');
        doc.font('Helvetica-Bold').text(`Due Date: `, { continued: true }).font('Helvetica').text(new Date(inv.dueDate).toLocaleDateString());
        doc.font('Helvetica-Bold').text(`Payment Status: `, { continued: true }).font('Helvetica').text(inv.paymentStatus);
        doc.moveDown();

        doc.font('Helvetica-Bold').text(`Amount: `, { continued: true }).font('Helvetica').text(`₹${inv.amount?.toLocaleString()}`);
        doc.font('Helvetica-Bold').text(`Paid: `, { continued: true }).font('Helvetica').text(`₹${inv.paidAmount?.toLocaleString()}`);
        doc.font('Helvetica-Bold').fontSize(14).text(`Outstanding: ₹${inv.outstandingAmount?.toLocaleString()}`);

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { generatePOPdf, generateInvoicePdf };
