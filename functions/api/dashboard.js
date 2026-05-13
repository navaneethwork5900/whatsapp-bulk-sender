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
          firstJourneyTime: parsed.firstJourneyTime || Date.now()
        });
      } catch {
        passengers.push({ mobile: key.name, count: Number(value) || 0, firstJourneyTime: Date.now() });
      }
    }
    cursor = listResult.cursor;
    if (listResult.list_complete) break;
  } while (cursor);

  const loyaltyPassengers = passengers.filter(p => p.count >= 5).sort((a, b) => b.count - a.count);

  const totalMessages = passengers.reduce((acc, p) => acc + p.count, 0);

  return Response.json({
    success: true,
    analytics: {
      totalMessages,
      loyaltyCustomers: loyaltyPassengers.length,
      activePassengers: passengers.length
    },
    passengers: passengers.sort((a, b) => b.count - a.count),
    loyaltyPassengers
  });
}
