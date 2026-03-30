export async function createCashEntry(request: Request, env: any) {
  try {
    const body: any = await request.json();
    const { type, amount, description, date } = body;

    if (!["in", "out"].includes(type)) {
      return Response.json(
        { success: false, message: "Tipo inválido" },
        { status: 400 }
      );
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return Response.json(
        { success: false, message: "Valor inválido" },
        { status: 400 }
      );
    }

    if (!description || String(description).trim() === "") {
      return Response.json(
        { success: false, message: "Descrição obrigatória" },
        { status: 400 }
      );
    }

    // 🔥 Normaliza data para YYYY-MM-DD
    const entryDate = date
      ? String(date).substring(0, 10)
      : new Date().toISOString().substring(0, 10);

    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO cash_entries (id, type, amount, description, date, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `)
    .bind(id, type, Number(amount), description.trim(), entryDate)
    .run();

    return Response.json({ success: true, id });

  } catch (err: any) {
    console.error("ERRO CASH:", err);
    return Response.json(
      { success: false, message: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}

export async function listCashEntries(env: any) {
  const result = await env.DB.prepare(`
    SELECT * FROM cash_entries
    WHERE status IS NULL OR status != 'cancelled'
    ORDER BY date DESC, created_at DESC
  `).all();

  return Response.json({ success: true, data: result.results });
}

export async function cancelCashEntry(request: Request, env: any) {
  try {
    const body: any = await request.json();
    const id = body?.id;

    if (!id) {
      return Response.json(
        { success: false, message: "ID é obrigatório" },
        { status: 400 }
      );
    }

    // 🔥 Verifica existência
    const existing = await env.DB.prepare(`
      SELECT id FROM cash_entries
      WHERE id = ? AND (status IS NULL OR status != 'cancelled')
    `).bind(id).first();

    if (!existing) {
      return Response.json(
        { success: false, message: "Movimentação não encontrada" },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE cash_entries
      SET status = 'cancelled'
      WHERE id = ?
    `).bind(id).run();

    return Response.json({ success: true });

  } catch (err: any) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}