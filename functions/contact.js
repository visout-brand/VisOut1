// functions/contact.js
export async function onRequest(context) {
    const { request } = context;
    
    // Only handle POST requests
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        // Get form data
        const formData = await request.formData();
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        
        // Validate fields
        if (!name || !email || !message) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: 'Please fill in all fields.' 
                }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // Get API credentials from environment
        const apiToken = context.env.CLOUDFLARE_API_TOKEN;
        const accountId = context.env.CLOUDFLARE_ACCOUNT_ID;
        
        if (!apiToken || !accountId) {
            console.error('Missing API credentials');
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: 'Configuration error. Please contact the site owner.' 
                }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        // Prepare email data
        const emailData = {
            personalization: {
                to: [{ email: 'hello@visout.com.ng' }]
            },
            from: {
                email: 'hello@visout.com.ng'
            },
            subject: `New Contact Form Submission from ${name}`,
            content: [
                {
                    type: 'text/plain',
                    value: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
                }
            ]
        };
        
        // Send email using Cloudflare's Email API
        const emailResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/routing/email`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            }
        );
        
        const emailResult = await emailResponse.text();
        console.log('Email API response:', emailResult);
        
        if (!emailResponse.ok) {
            throw new Error(`Email API error: ${emailResponse.status} - ${emailResult}`);
        }
        
        // Return success
        return new Response(
            JSON.stringify({ 
                success: true, 
                message: 'Thank you! Your message has been sent. We\'ll get back to you soon.' 
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Error:', error.message);
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: 'Oops! Something went wrong. Please try again.' 
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
