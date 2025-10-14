import request from "supertest";
import app from "../../../src/app";

describe("GET /api/services", () => {
  it("returns array of services", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    // The controller formats response as array directly
    expect(Array.isArray(res.body)).toBe(true);
    // If seed created services, ensure at least one
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("tag");
      expect(res.body[0]).toHaveProperty("name");
    }
  });
});

//TODO: check tests above and add more
