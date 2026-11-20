// Partially written by AI.

const {
  DescribeTableCommand,
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const DEFAULT_BASE_URL =
  "https://3hayumc9i0.execute-api.us-east-2.amazonaws.com/dev";
const baseUrl = (
  process.argv[2] ||
  process.env.TWEETER_API_BASE_URL ||
  DEFAULT_BASE_URL
).replace(/\/+$/, "");

const REGION = "us-east-2";
const ACCOUNT_ID = "727728513382";
const TABLES = {
  users: "users",
  auth: "auth",
  sessions: "sessions",
  follows: "follows",
  statuses: "statuses",
  feed: "feed",
};

const lowLevelClient = new DynamoDBClient({
  region: REGION,
  maxAttempts: 5,
});
const documentClient = DynamoDBDocumentClient.from(lowLevelClient);
const cleanupEntries = new Map();
const failures = [];
let passed = 0;

function trackCleanup(tableName, key) {
  cleanupEntries.set(`${tableName}:${JSON.stringify(key)}`, {
    tableName,
    key,
  });
}

async function putTrackedItem(tableName, item, key) {
  trackCleanup(tableName, key);
  await documentClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    }),
  );
}

async function verifyDatabaseTarget() {
  const output = await lowLevelClient.send(
    new DescribeTableCommand({ TableName: TABLES.users }),
  );
  const expectedArn =
    `arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${TABLES.users}`;
  if (
    output.Table?.TableStatus !== "ACTIVE" ||
    output.Table.TableArn !== expectedArn
  ) {
    throw new Error("Refusing to use an unexpected DynamoDB deployment");
  }
}

async function cleanup() {
  const entries = [...cleanupEntries.values()].reverse();
  const cleanupFailures = [];

  for (const entry of entries) {
    try {
      await documentClient.send(
        new DeleteCommand({
          TableName: entry.tableName,
          Key: entry.key,
        }),
      );
    } catch (error) {
      cleanupFailures.push(
        `delete ${entry.tableName}:${JSON.stringify(entry.key)}: ${error}`,
      );
    }
  }

  for (const entry of entries) {
    try {
      const output = await documentClient.send(
        new GetCommand({
          TableName: entry.tableName,
          Key: entry.key,
          ConsistentRead: true,
        }),
      );
      if (output.Item !== undefined) {
        cleanupFailures.push(
          `item remained in ${entry.tableName}:${JSON.stringify(entry.key)}`,
        );
      }
    } catch (error) {
      cleanupFailures.push(
        `verify ${entry.tableName}:${JSON.stringify(entry.key)}: ${error}`,
      );
    }
  }

  lowLevelClient.destroy();

  if (cleanupFailures.length > 0) {
    throw new Error(cleanupFailures.join("\n"));
  }
}

async function waitFor(description, condition) {
  const delays = [50, 100, 200, 400, 800, 1600];
  for (const delay of delays) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  if (!(await condition())) {
    throw new Error(`Timed out waiting for ${description}`);
  }
}

async function waitForFollowIndex(followerAlias, followeeAlias) {
  await waitFor(
    `follow index entry '${followerAlias}' -> '${followeeAlias}'`,
    async () => {
      const output = await documentClient.send(
        new QueryCommand({
          TableName: TABLES.follows,
          IndexName: "follows_index",
          KeyConditionExpression: "followee_handle = :followee",
          ExpressionAttributeValues: {
            ":followee": followeeAlias,
          },
        }),
      );
      return (output.Items || []).some(
        (item) => item.follower_handle === followerAlias,
      );
    },
  );
}

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
  const alias = `@endpointtest${runId}-current`;
  const targetAlias = `@endpointtest${runId}-target`;
  const password = "EndpointTest123!";
  const image =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  console.log(`Testing ${baseUrl}\n`);
  await verifyDatabaseTarget();

  trackCleanup(TABLES.users, { alias });
  trackCleanup(TABLES.auth, { alias });
  trackCleanup(TABLES.users, { alias: targetAlias });
  trackCleanup(TABLES.auth, { alias: targetAlias });

  try {
    const registerResponse = await test(
      "register",
      "/register",
      {
        firstName: "Endpoint",
        lastName: "Current",
        alias,
        password,
        userImageBytes: image,
        imageFileExtension: "png",
      },
      assertAuthResponse,
    );
    if (registerResponse?.authToken?.token) {
      trackCleanup(TABLES.sessions, {
        token: registerResponse.authToken.token,
      });
    }

    const targetRegisterResponse = await test(
      "register target fixture",
      "/register",
      {
        firstName: "Endpoint",
        lastName: "Target",
        alias: targetAlias,
        password,
        userImageBytes: image,
        imageFileExtension: "png",
      },
      assertAuthResponse,
    );
    if (targetRegisterResponse?.authToken?.token) {
      trackCleanup(TABLES.sessions, {
        token: targetRegisterResponse.authToken.token,
      });
    }

    const loginResponse = await test(
      "login",
      "/login",
      { alias, password },
      assertAuthResponse,
    );
    if (loginResponse?.authToken?.token) {
      trackCleanup(TABLES.sessions, {
        token: loginResponse.authToken.token,
      });
    }

    const session = loginResponse || registerResponse;
    const token = session?.authToken?.token || "endpoint-test-token";
    const currentUser = session?.user || {
      firstName: "Endpoint",
      lastName: "Current",
      alias,
      imageUrl: image,
    };
    const targetUser = targetRegisterResponse?.user || {
      firstName: "Endpoint",
      lastName: "Target",
      alias: targetAlias,
      imageUrl: image,
    };

    await test(
      "get user",
      "/user",
      { token, alias: targetAlias },
      (response) => {
        assertUser(response.user);
        assert(response.user.alias === targetAlias, "returned wrong user");
      },
    );

    await test(
      "get follower status before follow",
      "/is-follower-status",
      { token, user: currentUser, selectedUser: targetUser },
      (response) =>
        assert(response.isFollower === false, "users already followed"),
    );

    trackCleanup(TABLES.follows, {
      follower_handle: currentUser.alias,
      followee_handle: targetUser.alias,
    });
    await test(
      "follow",
      "/follow",
      { token, userToFollow: targetUser },
      (response) => {
        assert(
          typeof response.followerCount === "number",
          "missing followerCount",
        );
        assert(
          typeof response.followeeCount === "number",
          "missing followeeCount",
        );
      },
    );
    await waitForFollowIndex(currentUser.alias, targetUser.alias);

    await test(
      "get followees",
      "/followees",
      {
        token,
        userAlias: currentUser.alias,
        pageSize: 10,
        lastItem: null,
      },
      (response) => {
        assert(Array.isArray(response.items), "items was not an array");
        assert(
          response.items.some((user) => user.alias === targetUser.alias),
          "target user was not returned as a followee",
        );
      },
    );

    await test(
      "get followers",
      "/followers",
      {
        token,
        userAlias: targetUser.alias,
        pageSize: 10,
        lastItem: null,
      },
      (response) => {
        assert(Array.isArray(response.items), "items was not an array");
        assert(
          response.items.some((user) => user.alias === currentUser.alias),
          "current user was not returned as a follower",
        );
      },
    );

    await test(
      "get followee count",
      "/followee-count",
      { token, user: currentUser },
      (response) =>
        assert(response.followeeCount === 1, "unexpected followee count"),
    );

    await test(
      "get follower count",
      "/follower-count",
      { token, user: targetUser },
      (response) =>
        assert(response.followerCount === 1, "unexpected follower count"),
    );

    const postText = `Endpoint smoke test ${new Date().toISOString()}`;
    const timestamp = Date.now();
    const status = {
      post: postText,
      user: currentUser,
      timestamp,
      segments: [
        {
          text: postText,
          startPosition: 0,
          endPosition: postText.length,
          type: "Text",
        },
      ],
    };
    trackCleanup(TABLES.statuses, {
      user_alias: currentUser.alias,
      timestamp,
    });
    const postResponse = await test("post status", "/post-status", {
      token,
      status,
    });

    await test(
      "load story items",
      "/story-items",
      {
        token,
        userAlias: currentUser.alias,
        pageSize: 10,
        lastItem: null,
      },
      (response) => {
        assert(Array.isArray(response.items), "items was not an array");
        assert(
          response.items.some(
            (item) =>
              item.user.alias === currentUser.alias &&
              item.timestamp === timestamp,
          ),
          "posted status was not returned in the story",
        );
      },
    );

    if (postResponse !== null) {
      await putTrackedItem(
        TABLES.feed,
        {
          feed_user_alias: currentUser.alias,
          status_user_alias: currentUser.alias,
          timestamp,
        },
        {
          feed_user_alias: currentUser.alias,
          timestamp,
        },
      );
    }

    await test(
      "load feed items",
      "/feed-items",
      {
        token,
        userAlias: currentUser.alias,
        pageSize: 10,
        lastItem: null,
      },
      (response) => {
        assert(Array.isArray(response.items), "items was not an array");
        assert(
          response.items.some(
            (item) =>
              item.user.alias === currentUser.alias &&
              item.timestamp === timestamp,
          ),
          "posted status was not returned in the feed",
        );
      },
    );

    await test(
      "unfollow",
      "/unfollow",
      { token, userToUnfollow: targetUser },
      (response) => {
        assert(
          typeof response.followerCount === "number",
          "missing followerCount",
        );
        assert(
          typeof response.followeeCount === "number",
          "missing followeeCount",
        );
      },
    );

    const tokens = new Set(
      [
        registerResponse?.authToken?.token,
        targetRegisterResponse?.authToken?.token,
        loginResponse?.authToken?.token,
      ].filter(Boolean),
    );
    for (const sessionToken of tokens) {
      await test("logout", "/logout", { token: sessionToken });
    }
  } finally {
    await cleanup();
  }

  console.log(`\n${passed} endpoint smoke checks passed.`);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  lowLevelClient.destroy();
  console.error(error);
  process.exitCode = 1;
});
