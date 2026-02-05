// OLS 108: Send Enquiry Email Notification via SendGrid
// Reads API configuration from site-settings Blobs

const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse the enquiry data from request body
        const enquiryData = JSON.parse(event.body);
        
        console.log('📧 Sending email notification for enquiry:', enquiryData.id);
        
        // Step 1: Load SendGrid config from site-settings
        const siteSettingsStore = getStore({
            name: 'ols-site-settings',  // Fixed: Match site-settings.js
            siteID: process.env.SITE_ID,
            token: process.env.NETLIFY_ACCESS_TOKEN
        });
        
        const settingsBlob = await siteSettingsStore.get('current-settings', { type: 'json' });  // Fixed: Match site-settings.js
        
        if (!settingsBlob) {
            console.warn('⚠️ No site settings found - SendGrid not configured');
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'SendGrid not configured. Please configure in Admin Dashboard > Site Settings > Advanced Settings > API Configuration' 
                })
            };
        }
        
        const sendgridKey = settingsBlob['api-sendgrid-key'];
        const sendgridFromEmail = settingsBlob['api-sendgrid-from-email'];
        const sendgridNotifyEmail = settingsBlob['api-sendgrid-notify-email'];
        
        // Validate SendGrid configuration
        if (!sendgridKey || !sendgridFromEmail || !sendgridNotifyEmail) {
            console.warn('⚠️ SendGrid configuration incomplete');
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'SendGrid configuration incomplete. Please check Admin Dashboard > Site Settings > Advanced Settings > API Configuration' 
                })
            };
        }
        
        // Sanitize user input to prevent HTML injection in emails
        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // Sanitize all user-provided fields
        const safe = {
            eventType: escapeHtml(enquiryData.eventType),
            name: escapeHtml(enquiryData.name),
            email: escapeHtml(enquiryData.email),
            phone: escapeHtml(enquiryData.phone),
            eventDate: escapeHtml(enquiryData.eventDate),
            guests: escapeHtml(enquiryData.guests),
            message: escapeHtml(enquiryData.message),
            id: escapeHtml(enquiryData.id),
            createdAt: enquiryData.createdAt
        };

        // Step 2: Build email content
        const emailSubject = `New ${safe.eventType} Enquiry - ${safe.name}`;
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2e7d32, #8b1538); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #2e7d32; }
        .value { color: #333; margin-top: 5px; }
        .footer { background: #f0f0f0; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 0.9em; color: #666; }
        .button { display: inline-block; background: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">🏉 New Events Enquiry</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Received ${new Date(safe.createdAt).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="label">Event Type:</div>
                <div class="value">${safe.eventType}</div>
            </div>
            
            <div class="field">
                <div class="label">Name:</div>
                <div class="value">${safe.name}</div>
            </div>
            
            <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${safe.email}">${safe.email}</a></div>
            </div>
            
            <div class="field">
                <div class="label">Phone:</div>
                <div class="value">${safe.phone || 'Not provided'}</div>
            </div>
            
            <div class="field">
                <div class="label">Event Date:</div>
                <div class="value">${safe.eventDate || 'Not specified'}</div>
            </div>
            
            <div class="field">
                <div class="label">Number of Guests:</div>
                <div class="value">${safe.guests || 'Not specified'}</div>
            </div>
            
            <div class="field">
                <div class="label">Message:</div>
                <div class="value">${safe.message || 'No message provided'}</div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
                <p style="margin: 0; color: #666; font-size: 0.9em;">
                    <strong>Enquiry ID:</strong> ${safe.id}<br>
                    <strong>Status:</strong> New<br>
                    <strong>Submitted:</strong> ${new Date(safe.createdAt).toLocaleString()}
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">This is an automated notification from your club website.</p>
            <p style="margin: 5px 0 0 0;">Please respond to the enquiry at your earliest convenience.</p>
        </div>
    </div>
</body>
</html>
        `;
        
        // Plain text version
        const emailText = `
New ${safe.eventType} Enquiry

Name: ${safe.name}
Email: ${safe.email}
Phone: ${safe.phone || 'Not provided'}
Event Date: ${safe.eventDate || 'Not specified'}
Guests: ${safe.guests || 'Not specified'}

Message:
${safe.message || 'No message provided'}

Enquiry ID: ${safe.id}
Submitted: ${new Date(safe.createdAt).toLocaleString()}
        `;
        
        // Step 3: Send email via SendGrid
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: sendgridNotifyEmail }],
                    subject: emailSubject
                }],
                from: {
                    email: sendgridFromEmail,
                    name: 'Events Enquiry System'
                },
                content: [
                    {
                        type: 'text/plain',
                        value: emailText
                    },
                    {
                        type: 'text/html',
                        value: emailHtml
                    }
                ]
            })
        });
        
        if (!sendgridResponse.ok) {
            const errorText = await sendgridResponse.text();
            console.error('❌ SendGrid API error:', sendgridResponse.status, errorText);
            
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    success: false, 
                    error: `SendGrid error: ${sendgridResponse.status}`,
                    details: errorText
                })
            };
        }
        
        console.log('✅ Email notification sent successfully');
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Email notification sent successfully'
            })
        };
        
    } catch (error) {
        console.error('❌ Error sending email:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};