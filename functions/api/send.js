export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = String(body.mobile).trim();

        const now = Date.now();

        // Reset window

        const RESET_TIME =
            parseInt(
                context.env.RESET_TIME_MINUTES
            ) * 60 * 1000;

        // Fetch customer data

        let existingData =
            await context.env.MESSAGE_COUNTS.get(mobile);

        let count = 0;

        // IMPORTANT:
        // firstJourneyTime stays fixed

        let firstJourneyTime = now;

        if (existingData) {

            existingData = JSON.parse(existingData);

            count = existingData.count || 0;

            firstJourneyTime =
                existingData.firstJourneyTime || now;

            // Check fixed window expiry

            if ((now - firstJourneyTime)
                > RESET_TIME) {

                // RESET EVERYTHING

                count = 0;

                firstJourneyTime = now;
            }
        }

        // Increment journey count

        count++;

        // Save updated customer data

        await context.env.MESSAGE_COUNTS.put(
            mobile,
            JSON.stringify({
                count,
                firstJourneyTime
            })
        );

        // Reusable sender

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

        // Always send feedback

        await sendTemplate(
            "hello_world"
        );

        let loyaltyCouponSent = false;

        // Loyalty reward

        if (count >= 5) {

            await sendTemplate(
                "hello_world"
            );

            loyaltyCouponSent = true;
        }

        return Response.json({

            success: true,

            mobile,

            journeyCount: count,

            loyaltyCouponSent,

            firstJourneyTime,

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
