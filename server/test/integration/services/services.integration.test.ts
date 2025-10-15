import request from "supertest";
import app from "../../../src/app";

describe("GET /api/services", () => {
  it("returns array of services", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    // response should be JSON
    expect(res.headers).toHaveProperty("content-type");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    // The controller formats response as array directly
    expect(Array.isArray(res.body)).toBe(true);
    // If seed created services, ensure at least three and check shape
    if (res.body.length > 0) {
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      res.body.forEach((s: any) => {
        expect(s).toHaveProperty("id");
        expect(
          typeof s.id === "number" || typeof s.id === "string"
        ).toBeTruthy();
        expect(s).toHaveProperty("tag");
        expect(s).toHaveProperty("name");
      });

      // tags should be sorted ascending by tag
      const tags = res.body.map((s: any) => s.tag);
      const sorted = [...tags].sort((a, b) => a.localeCompare(b));
      expect(tags).toEqual(sorted);
    }
  });
});

//TODO: check tests above and add more
