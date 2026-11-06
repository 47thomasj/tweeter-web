// Partially written by AI.

const DEFAULT_BASE_URL =
  "https://3hayumc9i0.execute-api.us-east-2.amazonaws.com/dev";
const baseUrl = (
  process.argv[2] ||
  process.env.TWEETER_API_BASE_URL ||
  DEFAULT_BASE_URL
).replace(/\/+$/, "");

const failures = [];
let passed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUser(user) {
  assert(user && typeof user === "object", "response did not include a user");
  assert(typeof user.alias === "string", "user did not include an alias");
}

function assertAuthResponse(response) {
  assertUser(response.user);
  assert(
    response.authToken && typeof response.authToken.token === "string",
    "response did not include an auth token",
  );
}

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${response.status} returned non-JSON: ${text}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }
  if (payload.success !== true) {
    throw new Error(payload.message || `unsuccessful response: ${text}`);
  }

  return payload;
}

async function test(name, path, body, validate = () => {}) {
  try {
    const response = await post(path, body);
    validate(response);
    passed += 1;
    console.log(`PASS ${name}`);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ name, message });
    console.error(`FAIL ${name}: ${message}`);
    return null;
  }
}

async function main() {
  const runId = Date.now();
  const alias = `@endpointtest${runId}`;
  const password = "EndpointTest123!";
  const image =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  console.log(`Testing ${baseUrl}\n`);

  const registerResponse = await test(
    "register",
    "/register",
    {
      firstName: "Endpoint",
      lastName: "Test",
      alias,
      password,
      userImageBytes: image,
      imageFileExtension: "png",
    },
    assertAuthResponse,
  );

  const loginResponse = await test(
    "login",
    "/login",
    { alias, password },
    assertAuthResponse,
  );

  const session = loginResponse || registerResponse;
  const token = session?.authToken?.token || "endpoint-test-token";
  const currentUser = session?.user || {
    firstName: "Allen",
    lastName: "Anderson",
    alias: "@allen",
    imageUrl: "",
  };

  const userResponse = await test(
    "get user",
    "/user",
    {
      token,
      alias: process.env.TWEETER_TARGET_ALIAS || "@amy",
    },
    (response) => assertUser(response.user),
  );

  const followeesResponse = await test(
    "get followees",
    "/followees",
    { token, userAlias: currentUser.alias, pageSize: 10, lastItem: null },
    (response) => {
      assert(Array.isArray(response.items), "items was not an array");
      assert(typeof response.hasMore === "boolean", "hasMore was not boolean");
    },
  );

  const followersResponse = await test(
    "get followers",
    "/followers",
    { token, userAlias: currentUser.alias, pageSize: 10, lastItem: null },
    (response) => {
      assert(Array.isArray(response.items), "items was not an array");
      assert(typeof response.hasMore === "boolean", "hasMore was not boolean");
    },
  );

  const listedUsers = [
    ...(followeesResponse?.items || []),
    ...(followersResponse?.items || []),
  ];
  const targetUser =
    userResponse?.user ||
    listedUsers.find((user) => user.alias !== currentUser.alias) ||
    currentUser;

  await test(
    "get followee count",
    "/followee-count",
    { token, user: currentUser },
    (response) =>
      assert(typeof response.followeeCount === "number", "missing followeeCount"),
  );

  await test(
    "get follower count",
    "/follower-count",
    { token, user: currentUser },
    (response) =>
      assert(typeof response.followerCount === "number", "missing followerCount"),
  );

  await test(
    "get follower status",
    "/is-follower-status",
    { token, user: currentUser, selectedUser: targetUser },
    (response) =>
      assert(typeof response.isFollower === "boolean", "missing isFollower"),
  );

  await test(
    "follow",
    "/follow",
    { token, userToFollow: targetUser },
    (response) => {
      assert(typeof response.followerCount === "number", "missing followerCount");
      assert(typeof response.followeeCount === "number", "missing followeeCount");
    },
  );

  await test(
    "unfollow",
    "/unfollow",
    { token, userToUnfollow: targetUser },
    (response) => {
      assert(typeof response.followerCount === "number", "missing followerCount");
      assert(typeof response.followeeCount === "number", "missing followeeCount");
    },
  );

  await test(
    "load feed items",
    "/feed-items",
    { token, userAlias: currentUser.alias, pageSize: 10, lastItem: null },
    (response) => {
      assert(Array.isArray(response.items), "items was not an array");
      assert(typeof response.hasMore === "boolean", "hasMore was not boolean");
    },
  );

  await test(
    "load story items",
    "/story-items",
    { token, userAlias: currentUser.alias, pageSize: 10, lastItem: null },
    (response) => {
      assert(Array.isArray(response.items), "items was not an array");
      assert(typeof response.hasMore === "boolean", "hasMore was not boolean");
    },
  );

  const post = `Endpoint smoke test ${new Date().toISOString()}`;
  await test("post status", "/post-status", {
    token,
    status: {
      post,
      user: currentUser,
      timestamp: Date.now(),
      segments: [
        {
          text: post,
          startPosition: 0,
          endPosition: post.length,
          type: "Text",
        },
      ],
    },
  });

  await test("logout", "/logout", { token });

  console.log(`\n${passed}/14 endpoint tests passed.`);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
