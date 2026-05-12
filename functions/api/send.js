export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = String(body.mobile).trim();

        const now = Date.now();

        // Reset window
        // Example:
        // 3 = 3 minutes
        // 43200 = 30 days

        const RESET_TIME =
            parseInt(
                context.env.RESET_TIME_MINUTES
            ) * 60 * 1000;

        // Fetch customer data

        let existingData =
            await context.env.MESSAGE_COUNTS.get(mobile);

        let count = 0;

        // Fixed window start time

        let firstJourneyTime = now;

        if (existingData) {

            existingData = JSON.parse(existingData);

            count = existingData.count || 0;

            firstJourneyTime =
                existingData.firstJourneyTime || now;

            // Reset if window expired

            if ((now - firstJourneyTime)
                > RESET_TIME) {

                count = 0;

                firstJourneyTime = now;
            }
        }

        // Reusable WhatsApp sender

        async function sendTemplate(templateName) {

            const response = await fetch(
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

            return await response.json();
        }

        // Send feedback message first

        const feedbackResponse =
            await sendTemplate(
                "hello_world"
            );

        // Check WhatsApp success

        const messageSentSuccessfully =
            feedbackResponse.messages &&
            feedbackResponse.messages.length > 0;

        // Invalid WhatsApp number

        if (!messageSentSuccessfully) {

            return Response.json({

                success: false,

                mobile,

                message:
                    "Number is not a valid WhatsApp number",

                whatsappResponse:
                    feedbackResponse
            });
        }

        // Increment journey count ONLY after success

        count++;

        // Save updated customer record

        await context.env.MESSAGE_COUNTS.put(
            mobile,
            JSON.stringify({
                count,
                firstJourneyTime
            })
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

            validWhatsAppNumber: true,

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
