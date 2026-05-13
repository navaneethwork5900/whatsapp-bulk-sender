export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = body.email;
    const password = body.password;

    const validEmail = context.env.ADMIN_EMAIL;
    const validPassword = context.env.ADMIN_PASSWORD;

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
    return Response.json({
      success: false,
      error: error.message
    });
  }
}
