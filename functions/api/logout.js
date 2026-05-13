export async function onRequestPost() {
  return Response.json({
    success: true,
    message: 'Logged out successfully'
  });
}
