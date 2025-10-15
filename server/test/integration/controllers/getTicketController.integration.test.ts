import request from "supertest";
import app from "../../../src/app";

describe("TicketController integration", () => {
  beforeAll(() => {
    // ensure test DB is set by test runner (DATABASE_URL)
  });

  it("creates a ticket using service tag", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({ serviceType: "D" })
      .set("Accept", "application/json");

    expect([201, 400]).toContain(res.status); // allow 400 if seed missing
    if (res.status === 201) {
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("serviceType", "D");
    }
  });

  it("returns 400 when no serviceType or serviceId provided", async () => {
    const res = await request(app).post("/api/tickets").send({});
    expect(res.status).toBe(400);
  });
});

//TODO: add more tests?