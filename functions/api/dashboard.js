export async function onRequestGet(context) {
  const token = context.request.headers.get('Authorization');

  if (token !== 'Bearer susheel-admin-auth') {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!context.env.MESSAGE_COUNTS) {
    return Response.json({ success: false, message: 'KV binding MESSAGE_COUNTS is missing.' }, { status: 500 });
  }

  const passengers = [];
  let cursor;

  do {
    const listResult = await context.env.MESSAGE_COUNTS.list({ cursor, limit: 1000 });
    for (const key of listResult.keys) {
      const value = await context.env.MESSAGE_COUNTS.get(key.name);
      if (!value) continue;
      try {
        const parsed = JSON.parse(value);
        passengers.push({
          mobile: key.name,
          count: parsed.count || 0,
          firstJourneyTime: parsed.firstJourneyTime || Date.now(),
          loyaltyPassProvidedAt: parsed.loyaltyPassProvidedAt || null
        });
      } catch {
        passengers.push({ mobile: key.name, count: Number(value) || 0, firstJourneyTime: Date.now(), loyaltyPassProvidedAt: null });
      }
    }
    cursor = listResult.cursor;
    if (listResult.list_complete) break;
  } while (cursor);

  const loyaltyEligiblePassengers = passengers.filter((p) => p.count >= 4).sort((a, b) => b.count - a.count);
  const loyaltyProvidedPassengers = passengers.filter((p) => !!p.loyaltyPassProvidedAt).sort((a, b) => b.count - a.count);
  const firstTimePassengers = passengers.filter((p) => p.count === 1);
  const repeatPassengers = passengers.filter((p) => p.count >= 2);
  const totalMessages = passengers.reduce((acc, p) => acc + p.count, 0);

  return Response.json({
    success: true,
    analytics: {
      totalMessages,
      loyaltyEligibleCustomers: loyaltyEligiblePassengers.length,
      loyaltyPassProvidedCustomers: loyaltyProvidedPassengers.length,
      firstTimeCustomers: firstTimePassengers.length,
      repeatCustomers: repeatPassengers.length,
      activePassengers: passengers.length
    },
    passengers: passengers.sort((a, b) => b.count - a.count),
    loyaltyEligiblePassengers,
    loyaltyProvidedPassengers
  });
}
