const ExcelJS = require('exceljs');
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');

const styleHeader = (ws) => {
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 28;
};

// @desc Export vendors to Excel
const exportVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find().lean();
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Vendors');
        ws.columns = [
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Contact Person', key: 'contactPerson', width: 22 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'Phone', key: 'phone', width: 18 },
            { header: 'GST/Tax ID', key: 'gstTaxId', width: 18 },
            { header: 'Rating', key: 'rating', width: 10 },
            { header: 'Performance', key: 'performanceScore', width: 14 },
            { header: 'Risk', key: 'riskIndex', width: 10 },
        ];
        vendors.forEach(v => ws.addRow(v));
        styleHeader(ws);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=vendors.xlsx');
        await wb.xlsx.write(res);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Export purchase orders to Excel
const exportPurchaseOrders = async (req, res) => {
    try {
        const orders = await PurchaseOrder.find().populate('vendor', 'name').lean();
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Purchase Orders');
        ws.columns = [
            { header: 'PO Number', key: 'poNumber', width: 16 },
            { header: 'Vendor', key: 'vendorName', width: 22 },
            { header: 'Items', key: 'itemCount', width: 10 },
            { header: 'Total Amount', key: 'totalAmount', width: 16 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Approval', key: 'approvalStatus', width: 14 },
            { header: 'Department', key: 'department', width: 16 },
            { header: 'Order Date', key: 'orderDate', width: 14 },
            { header: 'Expected Delivery', key: 'expectedDeliveryDate', width: 16 },
            { header: 'Late?', key: 'isLateDelivery', width: 8 },
        ];
        orders.forEach(o => ws.addRow({
            ...o,
            vendorName: o.vendor?.name || 'Unknown',
            itemCount: o.items?.length || 0,
            orderDate: o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '',
            expectedDeliveryDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString() : '',
            isLateDelivery: o.isLateDelivery ? 'Yes' : 'No',
        }));
        styleHeader(ws);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=purchase-orders.xlsx');
        await wb.xlsx.write(res);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Export invoices to Excel
const exportInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate('vendor', 'name').populate('purchaseOrder', 'poNumber').lean();
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Invoices');
        ws.columns = [
            { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
            { header: 'PO Number', key: 'poNumber', width: 16 },
            { header: 'Vendor', key: 'vendorName', width: 22 },
            { header: 'Amount', key: 'amount', width: 14 },
            { header: 'Paid', key: 'paidAmount', width: 14 },
            { header: 'Outstanding', key: 'outstandingAmount', width: 14 },
            { header: 'Status', key: 'paymentStatus', width: 12 },
            { header: 'Due Date', key: 'dueDate', width: 14 },
        ];
        invoices.forEach(inv => ws.addRow({
            ...inv,
            poNumber: inv.purchaseOrder?.poNumber || '',
            vendorName: inv.vendor?.name || '',
            dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
        }));
        styleHeader(ws);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=invoices.xlsx');
        await wb.xlsx.write(res);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc Export audit logs to Excel
const exportAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(1000).lean();
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Audit Logs');
        ws.columns = [
            { header: 'Timestamp', key: 'createdAt', width: 22 },
            { header: 'User', key: 'userName', width: 20 },
            { header: 'Action', key: 'action', width: 14 },
            { header: 'Entity Type', key: 'entityType', width: 16 },
            { header: 'Entity ID', key: 'entityId', width: 28 },
            { header: 'Details', key: 'metadata', width: 40 },
        ];
        logs.forEach(l => ws.addRow({
            createdAt: new Date(l.createdAt).toLocaleString(),
            userName: l.user?.name || 'System',
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId?.toString() || '',
            metadata: JSON.stringify(l.metadata || {}),
        }));
        styleHeader(ws);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.xlsx');
        await wb.xlsx.write(res);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { exportVendors, exportPurchaseOrders, exportInvoices, exportAuditLogs };
