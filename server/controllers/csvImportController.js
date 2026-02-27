const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const multer = require('multer');
const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const { logAudit } = require('../utils/auditLogger');

const upload = multer({ dest: path.join(__dirname, '../uploads/csv/') });

// Import vendors from CSV
const importVendors = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

        const results = [];
        const errors = [];
        let row = 0;

        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => {
                    row++;
                    if (!data.name || !data.contactPerson || !data.phone || !data.email) {
                        errors.push({ row, message: 'Missing required fields (name, contactPerson, phone, email)' });
                    } else {
                        results.push({
                            name: data.name.trim(),
                            contactPerson: data.contactPerson.trim(),
                            phone: data.phone.trim(),
                            email: data.email.trim().toLowerCase(),
                            address: data.address?.trim() || '',
                            gstTaxId: data.gstTaxId?.trim() || '',
                            rating: parseFloat(data.rating) || 0,
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Insert valid records, skip duplicates
        let imported = 0;
        let skipped = 0;
        for (const vendor of results) {
            const exists = await Vendor.findOne({ email: vendor.email });
            if (exists) {
                skipped++;
                errors.push({ row: 0, message: `Duplicate email: ${vendor.email}` });
            } else {
                const created = await Vendor.create(vendor);
                await logAudit(req.user._id, 'IMPORT', 'Vendor', created._id, { source: 'CSV' });
                imported++;
            }
        }

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.json({ imported, skipped, errors, total: row });
    } catch (error) {
        if (req.file?.path) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { importVendors, upload };
