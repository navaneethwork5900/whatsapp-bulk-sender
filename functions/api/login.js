export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const email = (body.email ?? '').trim().toLowerCase();
    const password = (body.password ?? '').trim();

    const validEmail = (context.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
    const validPassword = (context.env.ADMIN_PASSWORD ?? '').trim();

    if (!validEmail || !validPassword) {
      return Response.json(
        {
          success: false,
          message:
            'Server credentials are not configured. Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.'
        },
        {
          status: 500
        }
      );
    }

    if (email !== validEmail || password !== validPassword) {
      return Response.json(
        {
          success: false,
          message: 'Invalid credentials'
        },
        {
          status: 401
        }
      );
    }

    return Response.json({
      success: true,
      token: 'susheel-admin-auth'
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 400
      }
    );
  }
}
