import { requireAuth } from "./security/authorize";
import { handleAuthRoutes } from "./modules/auth/auth.routes";
import { handleStudentsRoutes } from "./modules/students/students.routes";
import { handleClassesRoutes } from "./modules/classes/classes.routes";
import { handleEnrollmentsRoutes } from "./modules/enrollments/enrollments.routes";
import { handlePaymentsRoutes } from "./modules/payments/payments.routes";
import { handleUnitsRoutes } from "./modules/units/units.routes";
import { handleTeachersRoutes } from "./modules/teachers/teachers.routes"
import { cashRoutes } from "./modules/payments/cash.routes";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);

  headers.set("Access-Control-Allow-Origin", "*");
 headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {

    // =========================
    // CORS - PRELIGHT
    // =========================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      const url = new URL(request.url);

      
     // ROTAS AUTH PUBLICAS
if (
  url.pathname === "/api/v1/auth/login" ||
  url.pathname === "/api/v1/auth/register"
) {
  const response = await handleAuthRoutes(
    request,
    env,
    url
  );

  if (response) return withCors(response);
}

      // =========================
      // AUTENTICAÇÃO OBRIGATÓRIA
      // =========================
      const authResult = await requireAuth(request, env);

      if (authResult instanceof Response) {
        return withCors(authResult);
      }

      const user = authResult.user;

      // AUTH ME
const authResponse = await handleAuthRoutes(
  request,
  env,
  url,
  user
);

if (authResponse) return withCors(authResponse);



      // =========================
      // STUDENTS
      // =========================
      const studentsResponse = await handleStudentsRoutes(
        request,
        env,
        url,
        user
      );

      if (studentsResponse) return withCors(studentsResponse);

      // =========================
      // CLASSES
      // =========================
      const classesResponse = await handleClassesRoutes(
        request,
        env,
        url,
        user
      );

      if (classesResponse) return withCors(classesResponse);

      // =========================
// UNITS
// =========================
const unitsResponse = await handleUnitsRoutes(
  request,
  env,
  url,
  user
);

if (unitsResponse) return withCors(unitsResponse);

// =========================
// TEACHERS
// =========================
const teachersResponse = await handleTeachersRoutes(
  request,
  env,
  url,
  user
);

if (teachersResponse) return withCors(teachersResponse);

      // =========================
      // ENROLLMENTS
      // =========================
      const enrollmentsResponse = await handleEnrollmentsRoutes(
        request,
        env,
        url,
        user
      );

      if (enrollmentsResponse) return withCors(enrollmentsResponse);

      // =========================
      // PAYMENTS
      // =========================
      const paymentsResponse = await handlePaymentsRoutes(
        request,
        env,
        url,
        user
      );

      if (paymentsResponse) return withCors(paymentsResponse);


      // =========================
      // CASH
     // =========================
       if (url.pathname.startsWith("/api/v1/cash")) {

  const cashResponse = await cashRoutes(
    request,
    env
  );

  if (cashResponse) return withCors(cashResponse);
}

      


      // =========================
      // 404
      // =========================
      return withCors(
        Response.json(
          { success: false, message: "Route not found" },
          { status: 404 }
        )
      );

    } catch (error: any) {

      return withCors(
        Response.json(
          {
            success: false,
            message: error?.message || "Internal server error",
          },
          { status: 500 }
        )
      );
    }
  },
};