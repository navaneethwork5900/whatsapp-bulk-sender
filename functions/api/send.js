export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = String(body.mobile).trim();

        // Fetch previous count

        let existingCount = await context.env.MESSAGE_COUNTS.get(mobile);

        existingCount = existingCount
            ? parseInt(existingCount)
            : 0;

        // Increment occurrence count

        const updatedCount = existingCount + 1;

        // Save updated count

        await context.env.MESSAGE_COUNTS.put(
            mobile,
            updatedCount.toString()
        );

        // Decide template

        let templateName = "hello_world";

        // 5th occurrence onwards

        if (updatedCount >= 5) {

            templateName = "hello_world";
            const response = await fetch(
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

        const data = await response.json();
        }

        // Send WhatsApp message

        const response = await fetch(
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

        const data = await response.json();

        return Response.json({
            success: true,
            mobile,
            previousCount: existingCount,
            currentCount: updatedCount,
            templateUsed: templateName,
            whatsappResponse: data
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
