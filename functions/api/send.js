export async function onRequestPost(context) {

    try {

        const body = await context.request.json();

        const mobile = body.mobile;

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
                        name: 'hello_world',
                        language: {
                            code: 'en_US'
                        }
                    }
                })
            }
        );

        const data = await response.json();

        return Response.json(data);

    } catch (error) {

        return Response.json({
            success: false,
            error: error.message
        }, {
            status: 500
        });
    }
}
