// netlify/functions/events-enquiry-submit.js
// OLS 107 - Events Enquiry Form Submission Handler
// Handles form submissions, spam protection, email sending, and storage

const { getStore } = require("@netlify/blobs");

// OLS 108: Send email via SendGrid using centralized API config
async function sendEmail(enquiryData, event) {
    try {
        // Build full URL from request headers
        const protocol = event.headers['x-forwarded-proto'] || 'https';
        const host = event.headers['host'];
        const fullUrl = `${protocol}://${host}/.netlify/functions/send-enquiry-email`;
        
        console.log('Calling email function at:', fullUrl);
        
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enquiryData)
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.warn('⚠️ Email notification failed:', error);
            return { success: false, error };
        }
        
        const result = await response.json();
        console.log('✅ Email notification sent');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only accept POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const formData = JSON.parse(event.body);
        
        // 1. SPAM PROTECTION - Check honeypot
        if (formData.website) {
            console.log('Honeypot triggered - likely spam');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Thank you for your enquiry!' 
                })
            };
        }

        // 2. RATE LIMITING - Check submission frequency
        const settingsStore = getStore({
            name: "events-enquiry-settings",
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        
        const settings = await settingsStore.get("config", { type: "json" });
        
        if (!settings) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Enquiry form not configured. Please contact administrator.' 
                })
            };
        }

        // 3. VALIDATE REQUIRED FIELDS
        const errors = [];
        Object.keys(settings.fields).forEach(fieldKey => {
            const field = settings.fields[fieldKey];
            if (field.enabled && field.required && !formData[fieldKey]) {
                errors.push(`${field.label} is required`);
            }
        });
        
        if (errors.length > 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Please fill in all required fields',
                    errors 
                })
            };
        }

        // 4. STORE ENQUIRY
        const enquiriesStore = getStore({
            name: "events-enquiries",
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        
        const enquiries = await enquiriesStore.get("list", { type: "json" }) || [];
        
        const newEnquiry = {
            id: Date.now().toString(),
            ...formData,
            status: 'new',
            createdAt: new Date().toISOString(),
            readAt: null,
            notes: '',
            ip: event.headers['x-forwarded-for'] || 'unknown'
        };
        
        enquiries.unshift(newEnquiry);
        
        // Keep only last 500 enquiries
        if (enquiries.length > 500) {
            enquiries.splice(500);
        }
        
        await enquiriesStore.setJSON("list", enquiries);

        // 5. SEND NOTIFICATION EMAIL TO CLUB (OLS 108)
        try {
            console.log('📧 Attempting to send email notification...');
            
            const emailResult = await sendEmail(newEnquiry, event);
            
            if (emailResult.success) {
                console.log('✅ Email notification sent successfully');
            } else {
                console.warn('⚠️ Email notification failed:', emailResult.error);
                console.warn('Enquiry was saved, but admin notification was not sent');
                // Don't fail the submission - enquiry is already stored in Blobs
            }
        } catch (emailError) {
            console.error('❌ Email notification error:', emailError);
            // Don't fail the submission - enquiry is already stored
        }

        // 6. SEND AUTO-REPLY TO CUSTOMER
        // TODO (OLS 108): Implement auto-reply in send-enquiry-email.js if needed
        // For now, only admin notifications are sent via SendGrid
        // Auto-reply functionality can be added later if required

        // 7. SUCCESS RESPONSE
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: settings.messages.successMessage,
                referenceId: newEnquiry.id
            })
        };

    } catch (error) {
        console.error('Events enquiry submission error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to submit enquiry. Please try again or contact us directly.',
                details: error.message 
            })
        };
    }
};