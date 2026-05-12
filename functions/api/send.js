export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = String(body.mobile).trim();

        // Fetch existing count

        let existingCount =
            await context.env.MESSAGE_COUNTS.get(mobile);

        existingCount = existingCount
            ? parseInt(existingCount)
            : 0;

        // Increment count

        const updatedCount = existingCount + 1;

        // Save updated count

        await context.env.MESSAGE_COUNTS.put(
            mobile,
            updatedCount.toString()
        );

        // Function to send message

        async function sendTemplateMessage(templateName) {

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

        await sendTemplateMessage("hello_world");

        // Send second message after 5th occurrence

        if (updatedCount >= 5) {

            await sendTemplateMessage("hello_world");
        }

        return Response.json({
            success: true,
            mobile,
            previousCount: existingCount,
            currentCount: updatedCount,
            secondMessageSent: updatedCount >= 5
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
