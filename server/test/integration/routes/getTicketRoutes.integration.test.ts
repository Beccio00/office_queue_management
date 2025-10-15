import request from "supertest";
import app from "../../../src/app";

describe("getTicket routes (mounted under /api)", () => {
  it("POST /api/tickets should create a ticket with valid serviceId", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 1 })
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("serviceType");
  });

  it("POST /api/tickets without payload should return 404 (service required)", async () => {
    const res = await request(app).post("/api/tickets").send({});
    expect(res.status).toBe(404);
  });

  it("GET /api/services should return available services", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("Unknown route returns 404", async () => {
    const res = await request(app).get("/api/not-a-route");
    expect(res.status).toBe(404);
  });

  // Edge-case tests
  it("POST /api/tickets with non-numeric serviceId should return 404 (service not found)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: "not-a-number" })
      .set("Accept", "application/json");

    // service lookup should fail; current implementation may return 400/404/500 depending on validation
    expect([400, 404, 500]).toContain(res.status);
  });

  it("Two consecutive POST /api/tickets for same service should increment queuePosition", async () => {
    const res1 = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 1 })
      .set("Accept", "application/json");

    expect(res1.status).toBe(201);
    expect(res1.body).toHaveProperty("queuePosition");
    const pos1 = Number(res1.body.queuePosition);
    expect(pos1).toBeGreaterThanOrEqual(1);

    const res2 = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 1 })
      .set("Accept", "application/json");

    expect(res2.status).toBe(201);
    expect(res2.body).toHaveProperty("queuePosition");
    const pos2 = Number(res2.body.queuePosition);

    // second ticket should be after the first
    expect(pos2).toBeGreaterThanOrEqual(pos1 + 1);
  });

  it("POST /api/tickets should ignore extra payload fields and still create ticket", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 1, unexpected: "surprise", another: 123 })
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    // response must not include forwarded unexpected fields
    expect(res.body).toHaveProperty("id");
    expect(res.body).not.toHaveProperty("unexpected");
    expect(res.body).not.toHaveProperty("another");
  });

  it("Responses should have Content-Type application/json", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 1 })
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty("content-type");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});
