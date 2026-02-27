const Webhook = require('../models/Webhook');
const https = require('https');
const http = require('http');

const getWebhooks = async (req, res) => {
    try {
        const webhooks = await Webhook.find().sort({ createdAt: -1 }).lean();
        res.json(webhooks);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createWebhook = async (req, res) => {
    try {
        const webhook = await Webhook.create(req.body);
        res.status(201).json(webhook);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateWebhook = async (req, res) => {
    try {
        const webhook = await Webhook.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!webhook) return res.status(404).json({ message: 'Webhook not found' });
        res.json(webhook);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteWebhook = async (req, res) => {
    try {
        await Webhook.findByIdAndDelete(req.params.id);
        res.json({ message: 'Webhook deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// Fire webhook event to all matching webhooks
const fireWebhookEvent = async (event, payload) => {
    try {
        const webhooks = await Webhook.find({ events: event, isActive: true });
        for (const wh of webhooks) {
            const data = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
            const url = new URL(wh.url);
            const client = url.protocol === 'https:' ? https : http;

            const req = client.request({ hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length, ...(wh.secret ? { 'X-Webhook-Secret': wh.secret } : {}) }, timeout: 5000 }, (res) => {
                wh.lastTriggered = new Date();
                if (res.statusCode >= 400) wh.failCount++;
                wh.save();
            });
            req.on('error', () => { wh.failCount++; wh.save(); });
            req.write(data);
            req.end();
        }
    } catch (err) { console.error('[Webhook] Fire error:', err.message); }
};

module.exports = { getWebhooks, createWebhook, updateWebhook, deleteWebhook, fireWebhookEvent };
