import { activateUser, loginUser, registerUser, sendOtp } from "@/lib/api/users";

describe("registerUser", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    // @ts-expect-error - tests override global fetch
    global.fetch = fetchMock;
  });

  it("posts to the registration endpoint without auth headers", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message:
          "Registration successful. Please check your email for OTP to activate your account.",
        user: {
          id: 1,
          email: "user@example.com",
          first_name: "John",
          last_name: "Doe",
          is_active: false,
          is_staff: false,
          created_at: "2026-01-03T12:00:00Z",
        },
      }),
    });

    await registerUser({
      email: "user@example.com",
      first_name: "John",
      last_name: "Doe",
      password: "securepassword123",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://source.endovillehealth.com/api/users/register/");
    expect(init).toMatchObject({
      method: "POST",
    });
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(init.headers?.Authorization).toBeUndefined();
  });

  it("throws on 400 when email already exists", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        email: ["user with this email address already exists."],
      }),
    });

    await expect(
      registerUser({
        email: "user@example.com",
        first_name: "John",
        last_name: "Doe",
        password: "securepassword123",
      })
    ).rejects.toThrow("API request failed: 400");
  });
});

describe("activateUser", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    // @ts-expect-error - tests override global fetch
    global.fetch = fetchMock;
  });

  it("posts to the activation endpoint without auth headers", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Account activated successfully.",
        user: {
          id: 1,
          email: "user@example.com",
          first_name: "John",
          last_name: "Doe",
          is_active: true,
          is_staff: false,
        },
      }),
    });

    await activateUser({
      email: "user@example.com",
      otp: "123456",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://source.endovillehealth.com/api/users/activate/");
    expect(init).toMatchObject({
      method: "POST",
    });
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(init.headers?.Authorization).toBeUndefined();
  });

  it("throws on 400 for invalid/expired OTP or user issues", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        otp: ["The OTP code is incorrect"],
      }),
    });

    await expect(
      activateUser({
        email: "user@example.com",
        otp: "000000",
      })
    ).rejects.toThrow("API request failed: 400");
  });
});

describe("sendOtp", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    // @ts-expect-error - tests override global fetch
    global.fetch = fetchMock;
  });

  it("posts to the send-otp endpoint without auth headers", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "OTP has been sent to your email address.",
      }),
    });

    await sendOtp({
      email: "user@example.com",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://source.endovillehealth.com/api/users/send-otp/");
    expect(init).toMatchObject({
      method: "POST",
    });
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(init.headers?.Authorization).toBeUndefined();
  });

  it("throws on 400 for send-otp error cases", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        email: ["No user exists with the provided email"],
      }),
    });

    await expect(
      sendOtp({
        email: "user@example.com",
      })
    ).rejects.toThrow("API request failed: 400");
  });
});

describe("loginUser", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    // @ts-expect-error - tests override global fetch
    global.fetch = fetchMock;
  });

  it("posts to the login endpoint without auth headers", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access: "access-token",
        refresh: "refresh-token",
        user: {
          id: 1,
          email: "cheruiyotfabian@gmail.com",
          phone: "07349688242",
          first_name: "Fabian",
          last_name: "Cheruiyot",
          image_url:
            "https://res.cloudinary.com/dizc06lpa/image/upload/v1768853670/user-profiles/jkjox5h0ncvmoy8aldyh.png",
          gender: "F",
          date_of_birth: "1978-06-08",
          is_active: true,
          created_at: "2026-01-02T00:21:47.161834Z",
        },
      }),
    });

    await loginUser({
      email: "user@example.com",
      password: "securepassword123",
      otp: "123456",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://source.endovillehealth.com/api/users/login/");
    expect(init).toMatchObject({
      method: "POST",
    });
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(init.headers?.Authorization).toBeUndefined();
  });

  it("throws on 400 for login error cases", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        detail: "Invalid Credentials: Email or password is incorrect",
      }),
    });

    await expect(
      loginUser({
        email: "user@example.com",
        password: "wrong-password",
        otp: "123456",
      })
    ).rejects.toThrow("API request failed: 400");
  });
});
