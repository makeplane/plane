const postgres = require("postgres");

const MAX_RETRIES = 10;
const RETRY_INTERVAL = 5000;

function createTestConnection() {
  return postgres(process.env.DB_URL || "", {
    max: 1,
    idle_timeout: 2,
    connect_timeout: 5,
  });
}

async function testConnection(sql) {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  } finally {
    sql.end();
  }
}

async function waitForDatabase() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Attempting to connect to database (${attempt}/${MAX_RETRIES})...`);

    const testSql = createTestConnection();
    if (await testConnection(testSql)) {
      console.log("Successfully Connected to database");
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
  }
  throw new Error("Failed to connect to database after ${MAX_RETRIES} attempts");
}

async function runMigrations() {
  try {
    await waitForDatabase();
  } catch (error) {
    console.error("Error running migrations", error);
    process.exit(1);
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log("Migration process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
