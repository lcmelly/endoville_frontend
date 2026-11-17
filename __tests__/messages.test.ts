import { createMessage } from "@/lib/api/messages";

describe("customer messages", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("posts a message with contact, optional order id, and captcha token", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 4,
          email: "amina@example.com",
          phone: "",
          message: "The bottle arrived open.",
          order_number: "k3nR8wQp0sL2aB9x",
          created_at: "2026-11-17T00:30:00Z",
        }),
    });

    await createMessage({
      email: "amina@example.com",
      message: "The bottle arrived open.",
      order_number: "k3nR8wQp0sL2aB9x",
      captcha_token: "turnstile-token",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      email: "amina@example.com",
      message: "The bottle arrived open.",
      order_number: "k3nR8wQp0sL2aB9x",
      captcha_token: "turnstile-token",
    });
  });
});