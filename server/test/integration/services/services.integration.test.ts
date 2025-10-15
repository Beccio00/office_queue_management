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

describe("GET /api/services - extra checks", () => {
  it("contains expected service tags from seed and correct names", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    const services = res.body as Array<{
      id: number;
      tag: string;
      name: string;
    }>;
    const tags = services.map((s) => s.tag);
    // seed uses single-letter tags: D (Money Deposit), S (Package Shipping), A (Account Management)
    const expectedTags = ["D", "S", "A"];
    expectedTags.forEach((t) => expect(tags).toContain(t));

    // Verify tag -> name mapping from seed
    const map = Object.fromEntries(services.map((s) => [s.tag, s.name]));
    expect(map["D"]).toBe("Money Deposit");
    expect(map["S"]).toBe("Package Shipping");
    expect(map["A"]).toBe("Account Management");
  });

  it("each service object exposes exactly id, tag and name", async () => {
    const res = await request(app).get("/api/services");
    expect(res.status).toBe(200);
    res.body.forEach((s: any) => {
      const keys = Object.keys(s).sort();
      expect(keys).toEqual(["id", "name", "tag"]);
    });
  });
});
