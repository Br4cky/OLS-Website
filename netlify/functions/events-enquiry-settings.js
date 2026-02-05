// netlify/functions/events-enquiry-settings.js
// OLS 107 - Events Enquiry Configuration
// Handles CRUD operations for events enquiry form settings

const { getStore } = require("@netlify/blobs");
const { requireAuth } = require('./auth-middleware');

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Require auth for write operations
    if (['POST', 'PUT'].includes(event.httpMethod)) {
        const authError = await requireAuth(event, headers);
        if (authError) return authError;
    }

    try {
        // Initialize Netlify Blobs
        const store = getStore({
            name: "events-enquiry-settings",
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });

        const method = event.httpMethod;

        // GET - Retrieve settings
        if (method === 'GET') {
            const settings = await store.get("config", { type: "json" });
            
            // Return defaults if no settings exist
            if (!settings) {
                const defaults = {
                    emails: ["info@olsrugby.com"],
                    fields: {
                        name: { enabled: true, required: true, label: "Full Name" },
                        email: { enabled: true, required: true, label: "Email Address" },
                        phone: { enabled: true, required: false, label: "Phone Number" },
                        eventType: { enabled: true, required: true, label: "Event Type", options: ["Wedding", "Corporate Event", "Birthday Party", "Rugby Event", "Other"] },
                        eventDate: { enabled: true, required: true, label: "Preferred Date" },
                        guests: { enabled: true, required: false, label: "Number of Guests" },
                        message: { enabled: true, required: false, label: "Special Requirements" }
                    },
                    messages: {
                        formTitle: "Venue Hire Enquiry",
                        formDescription: "Interested in hiring our facilities for your event? Fill out the form below and we'll get back to you within 24 hours.",
                        submitButton: "Send Enquiry",
                        successMessage: "Thank you for your enquiry! We'll be in touch within 24 hours.",
                        emailSubject: "New Venue Hire Enquiry from {name}",
                        autoReplyEnabled: true,
                        autoReplySubject: "We've received your enquiry",
                        autoReplyMessage: "Thank you for your interest in hiring our facilities. We've received your enquiry and will respond within 24 hours."
                    },
                    spam: {
                        honeypotEnabled: true,
                        rateLimitMinutes: 5
                    }
                };
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, data: defaults })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: settings })
            };
        }

        // POST/PUT - Save settings
        if (method === 'POST' || method === 'PUT') {
            const settings = JSON.parse(event.body);
            
            // Validate required fields
            if (!settings.emails || settings.emails.length === 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'At least one email address is required' 
                    })
                };
            }

            // Save to Blobs
            await store.setJSON("config", settings);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Events enquiry settings saved successfully',
                    data: settings
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Events enquiry settings error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to process request',
                details: error.message 
            })
        };
    }
};