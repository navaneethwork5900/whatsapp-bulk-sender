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
        message: 'Missing required environment variables. Please set WHATSAPP_TOKEN and PHONE_NUMBER_ID in Cloudflare Pages.',
        missing: {
          WHATSAPP_TOKEN: !whatsappToken,
          PHONE_NUMBER_ID: !phoneNumberId
        }
      }, { status: 500 });
    }

    if (!Number.isFinite(resetTimeMinutes) || resetTimeMinutes <= 0) {
      return Response.json({
        success: false,
        message: 'Invalid RESET_TIME_MINUTES. Please set a positive number in Cloudflare Pages.'
      }, { status: 500 });
    }

    if (!context.env.MESSAGE_COUNTS) {
      return Response.json({
        success: false,
        message: 'KV binding MESSAGE_COUNTS is missing. Add it under Settings → Bindings → Pages Functions.'
      }, { status: 500 });
    }

    const body = await context.request.json();
    const mobile = String(body.mobile ?? '').trim();
    const now = Date.now();

    const RESET_TIME = resetTimeMinutes * 60 * 1000;

    let existingData = await context.env.MESSAGE_COUNTS.get(mobile);
    let count = 0;
    let firstJourneyTime = now;
    let loyaltyPassProvidedAt = null;

    if (existingData) {
      try {
        existingData = JSON.parse(existingData);
        count = existingData.count || 0;
        firstJourneyTime = existingData.firstJourneyTime || now;
        loyaltyPassProvidedAt = existingData.loyaltyPassProvidedAt || null;
      } catch {
        count = parseInt(existingData, 10) || 0;
        firstJourneyTime = now;
      }

      if ((now - firstJourneyTime) > RESET_TIME) {
        count = 0;
        firstJourneyTime = now;
        loyaltyPassProvidedAt = null;
      }
    }

    async function sendTemplate(templateName) {
      const response = await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: mobile,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' }
          }
        })
      });

      return await response.json();
    }

    const firstMessageResponse = await sendTemplate('hello_world');
    const firstMessageOk = firstMessageResponse.messages && firstMessageResponse.messages.length > 0;

    if (!firstMessageOk) {
      return Response.json({
        success: false,
        mobile,
        message: 'Number is not a valid WhatsApp number',
        whatsappResponse: firstMessageResponse
      });
    }

    count++;

    let loyaltyCouponSent = false;
    let loyaltyResponse = null;

    if (count >= 4) {
      loyaltyResponse = await sendTemplate('susheel_travels');
      loyaltyCouponSent = !!(loyaltyResponse.messages && loyaltyResponse.messages.length > 0);
      if (loyaltyCouponSent && !loyaltyPassProvidedAt) {
        loyaltyPassProvidedAt = now;
      }
    }

    await context.env.MESSAGE_COUNTS.put(mobile, JSON.stringify({
      count,
      firstJourneyTime,
      loyaltyPassProvidedAt
    }));

    return Response.json({
      success: true,
      mobile,
      validWhatsAppNumber: true,
      journeyCount: count,
      isFirstJourney: count === 1,
      loyaltyCandidate: count >= 4,
      loyaltyCouponSent,
      loyaltyPassProvidedAt,
      firstJourneyTime,
      resetTimeMinutes: context.env.RESET_TIME_MINUTES
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
