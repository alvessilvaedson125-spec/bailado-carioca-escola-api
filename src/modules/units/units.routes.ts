import { requireRole } from "../../security/authorize";

export async function handleUnitsRoutes(
request: Request,
env: any,
url: URL,
user: any
) {

// LISTAR
if (url.pathname === "/api/v1/units" && request.method === "GET") {

const roleError = requireRole(user, ["admin","operator"]);
if (roleError) return roleError;

const { results } = await env.DB.prepare(`
SELECT *
FROM units
WHERE deleted_at IS NULL
ORDER BY created_at DESC
`).all();

return Response.json({
success: true,
data: results
});

}

// BUSCAR POR ID
if (url.pathname.startsWith("/api/v1/units/") && request.method === "GET") {

const roleError = requireRole(user, ["admin","operator"]);
if (roleError) return roleError;

const id = url.pathname.split("/").pop();

const result = await env.DB.prepare(`
SELECT *
FROM units
WHERE id = ?
AND deleted_at IS NULL
`)
.bind(id)
.first();

if(!result){

return Response.json(
{ success:false, message:"Unit not found"},
{ status:404 }
);

}

return Response.json({
success:true,
data:result
});

}

// CRIAR
if (url.pathname === "/api/v1/units" && request.method === "POST") {

const roleError = requireRole(user, ["admin"]);
if (roleError) return roleError;

const body = await request.json() as any;

if(!body.name){

return Response.json(
{ success:false, message:"Name is required"},
{ status:400 }
);

}

const id = crypto.randomUUID();

await env.DB.prepare(`
INSERT INTO units (
id,
name,
created_at,
updated_at
)
VALUES (?, ?, datetime('now'), datetime('now'))
`)
.bind(id, body.name)
.run();

return Response.json({
success:true,
id
});

}

// UPDATE
if (url.pathname.startsWith("/api/v1/units/") && request.method === "PUT") {

const roleError = requireRole(user, ["admin"]);
if (roleError) return roleError;

const id = url.pathname.split("/").pop();
const body = await request.json() as any;

await env.DB.prepare(`
UPDATE units
SET
name = ?,
updated_at = datetime('now')
WHERE id = ?
`)
.bind(body.name, id)
.run();

return Response.json({
success:true
});

}

// DELETE
if (url.pathname.startsWith("/api/v1/units/") && request.method === "DELETE") {

const roleError = requireRole(user, ["admin"]);
if (roleError) return roleError;

const id = url.pathname.split("/").pop();

await env.DB.prepare(`
UPDATE units
SET
deleted_at = datetime('now'),
updated_at = datetime('now')
WHERE id = ?
`)
.bind(id)
.run();

return Response.json({
success:true
});

}

return null;

}