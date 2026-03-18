import { requireRole } from "../../security/authorize"

export async function handleTeachersRoutes(
request: Request,
env: any,
url: URL,
user: any
){

// LISTAR PROFESSORES
if(url.pathname === "/api/v1/teachers" && request.method === "GET"){

const roleError = requireRole(user, ["admin","operator"])
if(roleError) return roleError

const { results } = await env.DB.prepare(`
SELECT *
FROM teachers
WHERE deleted_at IS NULL
ORDER BY created_at DESC
`).all()

return Response.json({
success: true,
data: results
})

}


// CRIAR PROFESSOR
if(url.pathname === "/api/v1/teachers" && request.method === "POST"){

const roleError = requireRole(user, ["admin"])
if(roleError) return roleError

const body: any = await request.json()

const id = crypto.randomUUID()

await env.DB.prepare(`
INSERT INTO teachers (
id,
name,
email,
phone,
status
)
VALUES (?, ?, ?, ?, ?)
`)
.bind(
id,
body.name,
body.email ?? null,
body.phone ?? null,
body.status ?? "active"
)
.run()

return Response.json({
success: true,
id
})

}


// EDITAR PROFESSOR
if(
url.pathname.startsWith("/api/v1/teachers/")
&& request.method === "PUT"
){

const roleError = requireRole(user, ["admin"])
if(roleError) return roleError

const id = url.pathname.split("/").pop()

const body: any = await request.json()

await env.DB.prepare(`
UPDATE teachers
SET
name = ?,
email = ?,
phone = ?,
status = ?
WHERE id = ?
`)
.bind(
body.name,
body.email ?? null,
body.phone ?? null,
body.status ?? "active",
id
)
.run()

return Response.json({
success: true
})

}

// DELETAR PROFESSOR
if(
url.pathname.startsWith("/api/v1/teachers/")
&& request.method === "DELETE"
){

const roleError = requireRole(user, ["admin"])
if(roleError) return roleError

const id = url.pathname.split("/").pop()

await env.DB.prepare(`
UPDATE teachers
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = ?
`)
.bind(id)
.run()

return Response.json({
success: true
})

}


return null

}