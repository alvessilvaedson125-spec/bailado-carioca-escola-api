import { generateJWT } from "../../security/jwt";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function handleAuthRoutes(
  request: Request,
  env: any,
  url: URL,
  user?: any
) {
  // REGISTER
  if (url.pathname === "/api/v1/auth/register" && request.method === "POST") {
    try {
     const body = await request.json() as any;
const { name, email, password } = body;

      if (!name || !email || !password) {
        return Response.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }

      const existing = await env.DB.prepare(
        "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL"
      ).bind(email).first();

      if (existing) {
        return Response.json(
          { success: false, message: "Email already registered" },
          { status: 400 }
        );
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const password_hash = await hashPassword(password);

      const adminExists = await env.DB.prepare(
        "SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL LIMIT 1"
      ).first();

      const role = adminExists ? "operator" : "admin";

      await env.DB.prepare(
        `INSERT INTO users 
         (id, name, email, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, name, email, password_hash, role, now, now).run();

      return Response.json({ success: true, id, role }, { status: 201 });

    } catch (error: any) {
      return Response.json(
        { success: false, message: error?.message || "Register error" },
        { status: 500 }
      );
    }
  }

  // LOGIN
  if (url.pathname === "/api/v1/auth/login" && request.method === "POST") {
    try {
      const body = await request.json() as any;
const { email, password } = body;

      if (!email || !password) {
        return Response.json(
          { success: false, message: "Missing credentials" },
          { status: 400 }
        );
      }

      const userData = await env.DB.prepare(
        "SELECT id, password_hash, role FROM users WHERE email = ? AND deleted_at IS NULL"
      ).bind(email).first();

      if (!userData) {
        return Response.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const generatedHash = await hashPassword(password);

      if (generatedHash !== userData.password_hash) {
        return Response.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = await generateJWT(
        {
          userId: userData.id,
          role: userData.role
        },
        env.JWT_SECRET,
        1000 * 60 * 60 * 2 // 2h
      );

      return Response.json({ success: true, token });

    } catch (error: any) {
  console.error("LOGIN ERROR:", error);

  return Response.json(
    { success: false, message: error?.message || "Login error" },
    { status: 500 }
  );
}
  }

  // ME
  if (url.pathname === "/api/v1/auth/me" && request.method === "GET") {
    if (!user) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      data: {
        userId: user.userId,
        role: user.role,
        exp: user.exp
      }
    });
  }

  return null;
}