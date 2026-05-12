export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = body.mobile;

        // Get current count

        let count = await context.env.MESSAGE_COUNTS.get(mobile);

        count = count ? parseInt(count) : 0;

        count++;

        // Save updated count

        await context.env.MESSAGE_COUNTS.put(
            mobile,
            count.toString()
        );

        // Decide template

        let templateName = "hello_world";

        if (count >= 5) {
            templateName = "hello_world";
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
            count,
            templateUsed: templateName,
            response: data
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
