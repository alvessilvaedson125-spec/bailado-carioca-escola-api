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

  // =========================
  // REGISTER
  // =========================
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

      const adminExists = await env.DB.prepare(
        "SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL LIMIT 1"
      ).first();

      // 🔥 Bloqueia register se já existe admin — use o painel de admin para criar usuários
      if (adminExists) {
        return Response.json(
          { success: false, message: "Registro público desabilitado. Use o painel de administração." },
          { status: 403 }
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

      const id            = crypto.randomUUID();
      const now           = new Date().toISOString();
      const password_hash = await hashPassword(password);

      // Primeiro usuário sempre será admin
      await env.DB.prepare(
        `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'admin', ?, ?)`
      ).bind(id, name, email, password_hash, now, now).run();

      return Response.json({ success: true, id, role: "admin" }, { status: 201 });

    } catch (error: any) {
      return Response.json(
        { success: false, message: error?.message || "Register error" },
        { status: 500 }
      );
    }
  }

  // =========================
  // LOGIN
  // =========================
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

      // 🔥 Busca name também
      const userData = await env.DB.prepare(
        "SELECT id, name, password_hash, role FROM users WHERE email = ? AND deleted_at IS NULL"
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
        { userId: userData.id, role: userData.role },
        env.JWT_SECRET,
        1000 * 60 * 60 * 8 // 🔥 8h em vez de 2h — mais prático no dia a dia
      );

      return Response.json({
        success: true,
        token,
        user: {
          userId: userData.id,
          name:   userData.name,  // 🔥 retorna name
          role:   userData.role
        }
      });

    } catch (error: any) {
      console.error("LOGIN ERROR:", error);
      return Response.json(
        { success: false, message: error?.message || "Login error" },
        { status: 500 }
      );
    }
  }

  // =========================
  // ME
  // =========================
  if (url.pathname === "/api/v1/auth/me" && request.method === "GET") {
    if (!user) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔥 Busca name atualizado do banco
    const userData = await env.DB.prepare(
      "SELECT name FROM users WHERE id = ? AND deleted_at IS NULL"
    ).bind(user.userId).first();

    return Response.json({
      success: true,
      data: {
        userId: user.userId,
        name:   userData?.name || "",
        role:   user.role,
        exp:    user.exp
      }
    });
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  if (url.pathname === "/api/v1/auth/refresh" && request.method === "POST") {
    if (!user) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verifica se o usuário ainda existe e está ativo
    const userData = await env.DB.prepare(
      "SELECT id, name, role FROM users WHERE id = ? AND deleted_at IS NULL"
    ).bind(user.userId).first();

    if (!userData) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 401 }
      );
    }

    // Gera novo token com mais 8h
    const token = await generateJWT(
      { userId: userData.id, role: userData.role },
      env.JWT_SECRET,
      1000 * 60 * 60 * 8
    );

    return Response.json({
      success: true,
      token,
      user: {
        userId: userData.id,
        name:   userData.name,
        role:   userData.role
      }
    });
  }

  return null;
}