import { requireRole } from "../../security/authorize";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function handleAdminRoutes(
  request: Request,
  env: any,
  url: URL,
  user: any
) {

  // =========================
  // LISTAR USUÁRIOS
  // =========================
  if (url.pathname === "/api/v1/admin/users" && request.method === "GET") {

    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const { results } = await env.DB.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `).all();

    return Response.json({ success: true, data: results });
  }

  // =========================
  // CRIAR USUÁRIO (OPERADOR)
  // =========================
  if (url.pathname === "/api/v1/admin/users" && request.method === "POST") {

    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const body = await request.json() as any;
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return Response.json(
        { success: false, message: "Nome, email e senha obrigatórios" },
        { status: 400 }
      );
    }

    const allowedRoles = ["admin", "operator"];
    if (!allowedRoles.includes(role)) {
      return Response.json(
        { success: false, message: "Perfil inválido" },
        { status: 400 }
      );
    }

    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL"
    ).bind(email).first();

    if (existing) {
      return Response.json(
        { success: false, message: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const password_hash = await hashPassword(password);

    await env.DB.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, email, password_hash, role, now, now).run();

    return Response.json({ success: true, id }, { status: 201 });
  }

  // =========================
  // DESATIVAR USUÁRIO
  // =========================
  if (
    url.pathname.startsWith("/api/v1/admin/users/") &&
    request.method === "DELETE"
  ) {

    const roleError = requireRole(user, ["admin"]);
    if (roleError) return roleError;

    const id = url.pathname.split("/").pop();

    // 🔒 admin não pode se desativar
    if (id === user.userId) {
      return Response.json(
        { success: false, message: "Você não pode desativar sua própria conta" },
        { status: 400 }
      );
    }

    await env.DB.prepare(`
      UPDATE users
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return Response.json({ success: true });
  }

  // =========================
  // TROCAR SENHA (PRÓPRIO USUÁRIO)
  // =========================
  if (url.pathname === "/api/v1/admin/change-password" && request.method === "POST") {

    const body = await request.json() as any;
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return Response.json(
        { success: false, message: "Preencha todos os campos" },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return Response.json(
        { success: false, message: "Nova senha deve ter ao menos 6 caracteres" },
        { status: 400 }
      );
    }

    const userData = await env.DB.prepare(
      "SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL"
    ).bind(user.userId).first();

    if (!userData) {
      return Response.json(
        { success: false, message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const currentHash = await hashPassword(current_password);

    if (currentHash !== userData.password_hash) {
      return Response.json(
        { success: false, message: "Senha atual incorreta" },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(new_password);

    await env.DB.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newHash, user.userId).run();

    return Response.json({ success: true, message: "Senha alterada com sucesso" });
  }

  return null;
}