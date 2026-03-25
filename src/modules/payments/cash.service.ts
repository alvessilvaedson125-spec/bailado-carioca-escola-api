export async function createCashEntry(request: Request, env: any) {

  try {

    const body: any = await request.json();
    const { type, amount, description, date } = body;

    if (!["in", "out"].includes(type)) {
      return new Response(JSON.stringify({
        success: false,
        message: "Tipo inválido"
      }), { status: 400 });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "Valor inválido"
      }), { status: 400 });
    }

    // 🔥 NOVO — ID EXPLÍCITO
    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO cash_entries (
        id,
        type,
        amount,
        description,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      type,
      amount,
      description || null,
      date || new Date().toISOString()
    )
    .run();

    return new Response(JSON.stringify({
      success: true,
      id
    }));

  } catch (err: any) {

    console.error("🔥 ERRO CASH:", err);

    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Erro interno"
    }), { status: 500 });

  }
}


export async function listCashEntries(env: any) {

  const result = await env.DB.prepare(`
    SELECT * FROM cash_entries
    WHERE status IS NULL OR status != 'cancelled'
    ORDER BY created_at DESC
  `).all();

  return new Response(JSON.stringify({
    success: true,
    data: result.results
  }));

}

export async function cancelCashEntry(request: Request, env: any) {
  try {
   const body: any = await request.json();
const id = body?.id;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: "ID é obrigatório"
      }), { status: 400 });
    }

    await env.DB.prepare(`
      UPDATE cash_entries
      SET status = 'cancelled'
      WHERE id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      success: true
    }));

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      message: err.message
    }), { status: 500 });
  }
}