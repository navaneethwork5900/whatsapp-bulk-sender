export async function onRequestPost(context) {

  try {

    const body =
      await context.request.json();

    const email =
      (body.email ?? '')
      .trim()
      .toLowerCase();

    const password =
      (body.password ?? '')
      .trim();

    // HARDCODED LOGIN

    const validEmail =
      'balaji010501@gmail.com';

    const validPassword =
      'Balaji@123';

    // VALIDATE

    if (
      email !== validEmail ||
      password !== validPassword
    ) {

      return Response.json(
        {
          success: false,
          message:
            'Invalid credentials'
        },
        {
          status: 401
        }
      );
    }

    // SUCCESS

    return Response.json({
      success: true,
      token:
        'susheel-admin-auth'
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
