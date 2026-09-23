import { describe, expect, it } from "bun:test";
import { createServer, serverApp } from "../src/index";

// Test suite for Hono server base setup and routes
describe("Server Application", () => {
  // Test health check endpoint response
  it("should return status ok on health endpoint", async () => {
    const testRequest = new Request("http://localhost/health");
    const testResponse = await serverApp.request(testRequest);
    const responsePayload = (await testResponse.json()) as { status: string };

    expect(testResponse.status).toBe(200);
    expect(responsePayload.status).toBe("ok");
  });

  // Test root endpoint response
  it("should return welcome message on root endpoint", async () => {
    const testRequest = new Request("http://localhost/");
    const testResponse = await serverApp.request(testRequest);
    const responsePayload = (await testResponse.json()) as { message: string };

    expect(testResponse.status).toBe(200);
    expect(responsePayload.message).toBe("In-Transit WMS API");
  });

  // Test 404 not found handler
  it("should return 404 for unknown route", async () => {
    const testRequest = new Request("http://localhost/non-existent-route");
    const testResponse = await serverApp.request(testRequest);
    const responsePayload = (await testResponse.json()) as { message: string };

    expect(testResponse.status).toBe(404);
    expect(responsePayload.message).toBe("Route not found");
  });

  // Test global error handler for thrown exception
  it("should return 500 when route handler throws error", async () => {
    const testApp = createServer();
    testApp.get("/error-trigger", () => {
      throw new Error("Simulated failure");
    });

    const testRequest = new Request("http://localhost/error-trigger");
    const testResponse = await testApp.request(testRequest);
    const responsePayload = (await testResponse.json()) as { message: string };

    expect(testResponse.status).toBe(500);
    expect(responsePayload.message).toBe("Internal server error");
  });
});
