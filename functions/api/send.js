export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = String(body.mobile).trim();

        // Current timestamp

        const now = Date.now();

        // Reset time from environment variable
        // Example:
        // 43200 = 30 days
        // 3 = 3 minutes (testing)

        const RESET_TIME =
            parseInt(
                context.env.RESET_TIME_MINUTES
            ) * 60 * 1000;

        // Fetch existing customer data

        let existingData =
            await context.env.MESSAGE_COUNTS.get(mobile);

        let count = 0;

        let lastUpdated = now;

        // Parse customer record

        if (existingData) {

            existingData = JSON.parse(existingData);

            count = existingData.count || 0;

            lastUpdated =
                existingData.lastUpdated || now;

            // Reset customer count
            // if inactive beyond reset window

            if ((now - lastUpdated) > RESET_TIME) {

                count = 0;
            }
        }

        // Increment journey count

        count++;

        // Save updated customer record

        await context.env.MESSAGE_COUNTS.put(
            mobile,
            JSON.stringify({
                count,
                lastUpdated: now
            })
        );

        // Reusable WhatsApp sender

        async function sendTemplate(templateName) {

            return await fetch(
                `https://graph.facebook.com/v25.0/${context.env.PHONE_NUMBER_ID}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization':
                            `Bearer ${context.env.WHATSAPP_TOKEN}`,

                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        messaging_product:
                            'whatsapp',

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

        // Always send feedback message

        await sendTemplate(
            "hello_world"
        );

        // Loyalty reward logic

        let loyaltyCouponSent = false;

        // 5th journey onwards

        if (count >= 5) {

            await sendTemplate(
                "hello_world"
            );

            loyaltyCouponSent = true;
        }

        // Final response

        return Response.json({

            success: true,

            mobile,

            journeyCount: count,

            loyaltyCouponSent,

            resetTimeMinutes:
                context.env.RESET_TIME_MINUTES

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
