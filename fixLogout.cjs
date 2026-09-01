const fs = require('fs');
const path = 'app/api/auth/logout/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("export async function POST(request: NextRequest) {", `
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.redirect(new URL('/login', request.url));
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    if (session.userId) {
      await writeAuditEvent({
        actorId: session.userId,
        actorRole: session.role,
        action: 'USER_LOGOUT',
        result: 'SUCCESS',
        metadata: { employeeId: session.employeeId }
      });
    }

    session.destroy();
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export async function POST(request: NextRequest) {`);

fs.writeFileSync(path, code);
console.log('Fixed logout route to support GET and redirect directly to /login');