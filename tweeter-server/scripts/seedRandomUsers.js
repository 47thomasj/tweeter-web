// Partially written by AI.

const { randomBytes, randomInt } = require("crypto");
const { mkdir, writeFile } = require("fs/promises");
const path = require("path");
const {
  DescribeTableCommand,
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb");
const {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");

const REGION = "us-east-2";
const ACCOUNT_ID = "727728513382";
const TABLES = {
  users: "users",
  auth: "auth",
  follows: "follows",
};
const USER_COUNT = 20;
const RELATIONSHIP_COUNT = 15;
const MAX_BATCH_SIZE = 25;
const MAX_BATCH_ATTEMPTS = 10;

const firstNames = [
  "Avery",
  "Blake",
  "Cameron",
  "Dakota",
  "Emerson",
  "Finley",
  "Hayden",
  "Jordan",
  "Kai",
  "Logan",
  "Morgan",
  "Parker",
  "Quinn",
  "Reese",
  "Riley",
  "Rowan",
  "Sage",
  "Sawyer",
  "Skyler",
  "Taylor",
];
const lastNames = [
  "Anderson",
  "Bennett",
  "Campbell",
  "Diaz",
  "Edwards",
  "Foster",
  "Garcia",
  "Hayes",
  "Ingram",
  "Jensen",
  "Kim",
  "Lee",
  "Mitchell",
  "Nguyen",
  "Owens",
  "Patel",
  "Reed",
  "Singh",
  "Turner",
  "Walker",
];

const lowLevelClient = new DynamoDBClient({
  region: REGION,
  maxAttempts: 5,
});
const documentClient = DynamoDBDocumentClient.from(lowLevelClient);

function createUsers(runId) {
  return Array.from({ length: USER_COUNT }, (_, index) => {
    const aliasSuffix = randomBytes(3).toString("hex");
    const alias = `@seed${runId}-${index + 1}-${aliasSuffix}`;

    return {
      alias,
      password: `Tw-${randomBytes(16).toString("hex")}-A1!`,
      firstName: firstNames[randomInt(firstNames.length)],
      lastName: lastNames[randomInt(lastNames.length)],
      imageUrl:
        `https://api.dicebear.com/9.x/identicon/svg?seed=` +
        encodeURIComponent(alias),
    };
  });
}

function createFollows(users) {
  const followsFifteen = users[0];
  const followedByFifteen = users[USER_COUNT - 1];
  const relatedUsers = users.slice(1, RELATIONSHIP_COUNT + 1);

  if (followsFifteen === undefined || followedByFifteen === undefined) {
    throw new Error("Could not select users for follow relationships");
  }

  return {
    followsFifteen,
    followedByFifteen,
    followees: relatedUsers,
    followers: relatedUsers,
    items: [
      ...relatedUsers.map((followee) => ({
        follower_handle: followsFifteen.alias,
        followee_handle: followee.alias,
      })),
      ...relatedUsers.map((follower) => ({
        follower_handle: follower.alias,
        followee_handle: followedByFifteen.alias,
      })),
    ],
  };
}

async function verifyDatabaseTarget() {
  for (const tableName of Object.values(TABLES)) {
    const output = await lowLevelClient.send(
      new DescribeTableCommand({ TableName: tableName }),
    );
    const expectedArn =
      `arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${tableName}`;

    if (
      output.Table?.TableStatus !== "ACTIVE" ||
      output.Table.TableArn !== expectedArn
    ) {
      throw new Error(
        `Refusing to write to unexpected DynamoDB table '${tableName}'`,
      );
    }
  }
}

async function waitBeforeRetry(attempt) {
  const baseDelay = Math.min(250 * 2 ** attempt, 5000);
  const jitter = randomInt(100);
  await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
}

async function putAll(tableName, items) {
  for (let start = 0; start < items.length; start += MAX_BATCH_SIZE) {
    let pendingWrites = items
      .slice(start, start + MAX_BATCH_SIZE)
      .map((item) => ({ PutRequest: { Item: item } }));

    for (
      let attempt = 0;
      pendingWrites.length > 0 && attempt < MAX_BATCH_ATTEMPTS;
      attempt += 1
    ) {
      const output = await documentClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: pendingWrites,
          },
        }),
      );
      pendingWrites = output.UnprocessedItems?.[tableName] ?? [];

      if (pendingWrites.length > 0 && attempt + 1 < MAX_BATCH_ATTEMPTS) {
        await waitBeforeRetry(attempt);
      }
    }

    if (pendingWrites.length > 0) {
      throw new Error(
        `DynamoDB did not process ${pendingWrites.length} writes for '${tableName}'`,
      );
    }
  }
}

async function saveCredentials(runId, users, relationships) {
  const outputDirectory = path.resolve(
    __dirname,
    "..",
    "..",
    ".cursor",
    "scratch",
  );
  const outputPath = path.join(
    outputDirectory,
    `seeded-user-credentials-${runId}.json`,
  );
  const output = {
    generatedAt: new Date().toISOString(),
    region: REGION,
    users: users.map(({ alias, password, firstName, lastName }) => ({
      alias,
      password,
      firstName,
      lastName,
    })),
    relationships: {
      followsFifteen: {
        alias: relationships.followsFifteen.alias,
        followees: relationships.followees.map((user) => user.alias),
      },
      followedByFifteen: {
        alias: relationships.followedByFifteen.alias,
        followers: relationships.followers.map((user) => user.alias),
      },
    },
  };

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  return outputPath;
}

async function main() {
  const runId = Date.now().toString(36);
  await verifyDatabaseTarget();

  const users = createUsers(runId);
  const relationships = createFollows(users);
  const authItems = await Promise.all(
    users.map(async (user) => ({
      alias: user.alias,
      password_hash: await bcrypt.hash(user.password, 10),
    })),
  );

  await putAll(
    TABLES.users,
    users.map(({ alias, firstName, lastName, imageUrl }) => ({
      alias,
      first_name: firstName,
      last_name: lastName,
      image_url: imageUrl,
    })),
  );
  await putAll(TABLES.auth, authItems);
  await putAll(TABLES.follows, relationships.items);

  const credentialsPath = await saveCredentials(
    runId,
    users,
    relationships,
  );
  const relativeCredentialsPath = path.relative(
    path.resolve(__dirname, "..", ".."),
    credentialsPath,
  );

  console.log(`Created ${users.length} users.`);
  console.log(`Created ${relationships.items.length} follow relationships.`);
  console.log(`Credentials saved to ${relativeCredentialsPath}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => {
    lowLevelClient.destroy();
  });
