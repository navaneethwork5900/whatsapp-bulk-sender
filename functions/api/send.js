export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = String(body.mobile).trim();

        // Current timestamp

        const now = Date.now();

        // Reset time from environment variable
        // Example:
        // RESET_TIME_MINUTES = 3

        const RESET_TIME =
            parseInt(
                context.env.RESET_TIME_MINUTES
            ) * 60 * 1000;

        // Fetch existing data from KV

        let existingData =
            await context.env.MESSAGE_COUNTS.get(mobile);

        let count = 0;

        let lastUpdated = now;

        // Parse existing record

        if (existingData) {

            existingData = JSON.parse(existingData);

            count = existingData.count || 0;

            lastUpdated =
                existingData.lastUpdated || now;

            // Reset count if older than configured time

            if ((now - lastUpdated) > RESET_TIME) {

                count = 0;
            }
        }

        // Increment count

        count++;

        // Save updated record

        await context.env.MESSAGE_COUNTS.put(
            mobile,
            JSON.stringify({
                count,
                lastUpdated: now
            })
        );

        // Function to send WhatsApp template

        async function sendTemplate(templateName) {

            return await fetch(
                `https://graph.facebook.com/v25.0/${context.env.PHONE_NUMBER_ID}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${context.env.WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: mobile,
                        type: 'template',
                        template: {
                            name: templateName,
                            language: {
                                code: 'en_US'
                            }
                        }
                    })
                }
            );
        }

                // Always send first message

        await sendTemplate("hello_world");

        // If count >= 5
        // send one more hello_world message

        let secondMessageSent = false;

        if (count >= 5) {

            await sendTemplate(
                "hello_world"
            );

            secondMessageSent = true;
        }

        // Response

        return Response.json({
            success: true,
            mobile,
            count,
            resetTimeMinutes:
                context.env.RESET_TIME_MINUTES,
            secondMessageSent
        });

    } catch (error) {

        return Response.json({
            success: false,
            error: error.message
        }, {
            status: 500
        });
    }
}
