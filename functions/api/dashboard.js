export async function onRequestGet(context) {
  const token = context.request.headers.get('Authorization');

  if (token !== 'Bearer susheel-admin-auth') {
    return Response.json(
      {
        success: false,
        message: 'Unauthorized'
      },
      { status: 401 }
    );
  }

  return Response.json({
    success: true,
    analytics: {
      totalMessages: 1524,
      loyaltyCustomers: 214,
      activePassengers: 875
    }
  });
}
