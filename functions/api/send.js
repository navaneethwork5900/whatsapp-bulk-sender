export async function onRequestPost(context) {

    const token = context.request.headers.get('Authorization');

    if (token !== 'Bearer susheel-admin-auth') {
        return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {

        const whatsappToken = (context.env.WHATSAPP_TOKEN ?? '').trim();
        const phoneNumberId = (context.env.PHONE_NUMBER_ID ?? '').trim();
        const resetTimeMinutes = parseInt(context.env.RESET_TIME_MINUTES, 10);

        if (!whatsappToken || !phoneNumberId) {

            return Response.json({

                success: false,

                message:
                    'Missing required environment variables. Please set WHATSAPP_TOKEN and PHONE_NUMBER_ID in Cloudflare Pages.',

                missing: {
                    WHATSAPP_TOKEN: !whatsappToken,
                    PHONE_NUMBER_ID: !phoneNumberId
                }
            }, {
                status: 500
            });
        }

        if (!Number.isFinite(resetTimeMinutes) || resetTimeMinutes <= 0) {

            return Response.json({

                success: false,

                message:
                    'Invalid RESET_TIME_MINUTES. Please set a positive number in Cloudflare Pages.'
            }, {
                status: 500
            });
        }

        if (!context.env.MESSAGE_COUNTS) {

            return Response.json({

                success: false,

                message:
                    'KV binding MESSAGE_COUNTS is missing. Add it under Settings → Bindings → Pages Functions.'
            }, {
                status: 500
            });
        }

        const body = await context.request.json();

        const mobile = String(body.mobile).trim();

        const now = Date.now();

        // Reset window
        // Example:
        // 3 = 3 minutes
        // 43200 = 30 days

        const RESET_TIME =
            resetTimeMinutes * 60 * 1000;

        // Fetch customer data

        let existingData =
            await context.env.MESSAGE_COUNTS.get(mobile);

        let count = 0;

        // Fixed window start time

        let firstJourneyTime = now;

        if (existingData) {

            try {

    existingData = JSON.parse(existingData);

    count = existingData.count || 0;

    firstJourneyTime =
        existingData.firstJourneyTime || now;

} catch {

    // Old numeric format support

    count = parseInt(existingData) || 0;

    firstJourneyTime = now;
}
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
                `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
                {
                    method: 'POST',

                    headers: {
                        'Authorization':
                            `Bearer ${whatsappToken}`,

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
