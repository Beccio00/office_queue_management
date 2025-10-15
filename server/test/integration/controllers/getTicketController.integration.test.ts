import request from "supertest";
import app from "../../../src/app";

describe("TicketController integration", () => {
  beforeAll(() => {
    // ensure test DB is set by test runner (DATABASE_URL)
  });

  it("creates a ticket using serviceId (original test)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 1 }) // seed creates service with id=1 (tag D)
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("serviceType", "D");
    expect(res.body).toHaveProperty("status", "WAITING");
    expect(res.body).toHaveProperty("queuePosition");
    expect(typeof res.body.queuePosition).toBe("number");
  });

  it("returns 404 when no serviceId provided", async () => {
    const res = await request(app).post("/api/tickets").send({});
    expect(res.status).toBe(404);
  });

  it("creates a ticket using serviceId", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 1 }) // seed creates service with id=1 (tag D)
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("serviceType");
    expect(res.body).toHaveProperty("status", "WAITING");
    expect(res.body).toHaveProperty("queuePosition");
    expect(typeof res.body.queuePosition).toBe("number");
  });

  it("returns 404 when serviceId does not exist", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 9999 })
      .set("Accept", "application/json");

    expect(res.status).toBe(404);
  });

  it("generates ticket code in correct format (TAG-###)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceId: 2 }) // seed creates service with id=2 (tag S)
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    // Format is TAG-### (e.g., S-001)
    expect(res.body.id).toMatch(/^[A-Z]-\d{3}$/);
  });

  describe("GET /api/services", () => {
    it("returns list of available services", async () => {
      const res = await request(app).get("/api/services");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // verify structure of first service
      const service = res.body[0];
      expect(service).toHaveProperty("id");
      expect(service).toHaveProperty("tag");
      expect(service).toHaveProperty("name");
    });

    it("returns services sorted by tag", async () => {
      const res = await request(app).get("/api/services");

      expect(res.status).toBe(200);
      const tags = res.body.map((s: any) => s.tag);
      const sortedTags = [...tags].sort();
      expect(tags).toEqual(sortedTags);
    });
  });
});
