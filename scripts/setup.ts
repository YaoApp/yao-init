import { log, Process } from "@yao/runtime";

/**
 * Init - Initialize the application with seed data
 * Run after first installation or to add missing seed data
 * yao run scripts.setup.Init
 * yao run scripts.setup.Init true  (force reinit)
 * @param force boolean whether to force reinit even if already initialized
 */
function Init(force: boolean = false) {
  // Check if already initialized
  if (!force && IsInstalled()) {
    log.Info("Application is already initialized. Use 'yao run scripts.setup.Init true' to force reinit.");
    return { status: "skipped", message: "Already initialized" };
  }

  log.Info("=== Starting Application Init ===");

  // Import seed data (skip duplicates)
  SetupRoles();
  SetupTypes();
  SetupMenus();
  SetupInvitationCodes();

  // Create root user if not exists
  SetupRootUser();

  log.Info("=== Application Init Completed ===");
  console.log("");
  console.log("========================================");
  console.log("  Root User Credentials");
  console.log("----------------------------------------");
  console.log(`  Email:    ${ROOT_USER.email}`);
  console.log(`  Password: ${ROOT_USER_PASSWORD}`);
  console.log("========================================");
  console.log("");
  console.log("Run 'yao start' to start the application");
  console.log("");

  return { status: "success", message: "Initialization completed" };
}

/**
 * Check if the application is already installed
 * @returns boolean
 */
function IsInstalled(): boolean {
  try {
    // Check if root user exists
    const users = Process("models.__yao.user.Get", {
      wheres: [{ column: "email", value: ROOT_USER.email }],
      limit: 1,
    });
    if (users && users.length > 0) {
      return true;
    }

    // Check if roles exist
    const roles = Process("models.__yao.role.Get", { limit: 1 });
    if (roles && roles.length > 0) {
      return true;
    }

    return false;
  } catch (e) {
    // Table might not exist yet
    return false;
  }
}

/**
 * Reset - Clear all data and reimport from seeds
 * WARNING: This will delete all existing data!
 * yao run scripts.setup.Reset
 */
function Reset() {
  log.Info("=== Starting Application Reset ===");
  log.Warn("WARNING: This will delete all existing data!");

  // Run migrate first to ensure tables exist
  log.Info("Running database migration...");
  MigrateModels();

  // Clear and reimport seed data
  ResetRoles();
  ResetTypes();
  ResetMenus();
  ResetInvitationCodes();

  // Recreate root user
  ResetRootUser();

  log.Info("=== Application Reset Completed ===");
}

/**
 * Migrate all required models
 */
function MigrateModels() {
  const models = ["menu"];
  for (const model of models) {
    try {
      Process(`models.${model}.Migrate`, false);
      log.Info(`Migrated model: ${model}`);
    } catch (e) {
      log.Warn(`Failed to migrate model ${model}: ${e}`);
    }
  }
}

// ============================================
// Seed Data Import Functions
// ============================================

/**
 * Setup roles - Import roles from seed data (skip duplicates)
 * yao run scripts.setup.SetupRoles
 */
function SetupRoles() {
  log.Info("Setting up roles...");

  const options = {
    chunk_size: 100,
    duplicate: "ignore",
    mode: "each",
  };

  const result = Process("seeds.import", "roles.csv", "__yao.role", options);

  log.Info(
    `Roles: Total=${result.total}, Success=${result.success}, Ignored=${result.ignore}, Failed=${result.failure}`
  );

  if (result.errors && result.errors.length > 0) {
    log.Error(`Roles import errors: %v`, result.errors);
  }
}

/**
 * Setup types - Import user types from seed data (skip duplicates)
 * yao run scripts.setup.SetupTypes
 */
function SetupTypes() {
  log.Info("Setting up user types...");

  const options = {
    chunk_size: 100,
    duplicate: "ignore",
    mode: "each",
  };

  const result = Process("seeds.import", "types.csv", "__yao.user.type", options);

  log.Info(
    `Types: Total=${result.total}, Success=${result.success}, Ignored=${result.ignore}, Failed=${result.failure}`
  );

  if (result.errors && result.errors.length > 0) {
    log.Error(`Types import errors: %v`, result.errors);
  }
}

/**
 * Setup menus - Import menus from seed data (skip duplicates)
 * yao run scripts.setup.SetupMenus
 */
function SetupMenus() {
  log.Info("Setting up menus...");

  const options = {
    chunk_size: 100,
    duplicate: "ignore",
    mode: "each",
  };

  const result = Process("seeds.import", "menus.csv", "menu", options);

  log.Info(
    `Menus: Total=${result.total}, Success=${result.success}, Ignored=${result.ignore}, Failed=${result.failure}`
  );

  if (result.errors && result.errors.length > 0) {
    log.Error(`Menus import errors: %v`, result.errors);
  }
}

/**
 * Setup invitation codes - Import invitation codes from seed data (skip duplicates)
 * yao run scripts.setup.SetupInvitationCodes
 */
function SetupInvitationCodes() {
  log.Info("Setting up invitation codes...");

  const options = {
    chunk_size: 100,
    duplicate: "ignore",
    mode: "each",
  };

  const result = Process("seeds.import", "invitation_codes.csv", "__yao.invitation", options);

  log.Info(
    `Invitation codes: Total=${result.total}, Success=${result.success}, Ignored=${result.ignore}, Failed=${result.failure}`
  );

  if (result.errors && result.errors.length > 0) {
    log.Error(`Invitation codes import errors: %v`, result.errors);
  }
}

// ============================================
// Reset Functions (Clear + Reimport)
// ============================================

/**
 * Reset roles - Clear all roles and reimport
 * yao run scripts.setup.ResetRoles
 */
function ResetRoles() {
  log.Info("Resetting roles...");

  const deleted = Process("models.__yao.role.DestroyWhere", {});
  log.Info(`Deleted ${deleted} roles`);

  SetupRoles();
}

/**
 * Reset types - Clear all user types and reimport
 * yao run scripts.setup.ResetTypes
 */
function ResetTypes() {
  log.Info("Resetting user types...");

  const deleted = Process("models.__yao.user.type.DestroyWhere", {});
  log.Info(`Deleted ${deleted} types`);

  SetupTypes();
}

/**
 * Reset menus - Clear all menus and reimport
 * yao run scripts.setup.ResetMenus
 */
function ResetMenus() {
  log.Info("Resetting menus...");

  const deleted = Process("models.menu.DestroyWhere", {});
  log.Info(`Deleted ${deleted} menus`);

  SetupMenus();
}

/**
 * Reset invitation codes - Clear all invitation codes and reimport
 * yao run scripts.setup.ResetInvitationCodes
 */
function ResetInvitationCodes() {
  log.Info("Resetting invitation codes...");

  const deleted = Process("models.__yao.invitation.DestroyWhere", {});
  log.Info(`Deleted ${deleted} invitation codes`);

  SetupInvitationCodes();
}

// ============================================
// Root User Management
// ============================================

/**
 * Generate a 12-digit numeric user_id
 */
function generateUserId(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return timestamp + random;
}

const ROOT_USER_PASSWORD = "YaoAgents.com";

const ROOT_USER = {
  email: "root@yaoagents.com",
  name: "Root",
  status: "active",
  role_id: "system:root",
  type: "selfhosting",
  locale: "en-us",
};

/**
 * Setup root user - Create root user if not exists
 * yao run scripts.setup.SetupRootUser
 */
function SetupRootUser() {
  log.Info("Setting up root user...");

  // Check if root user already exists
  const existing = Process("models.__yao.user.Get", {
    wheres: [{ column: "email", value: ROOT_USER.email }],
    limit: 1,
  });

  if (existing && existing.length > 0) {
    log.Info(`Root user already exists: ${ROOT_USER.email}`);
    return;
  }

  // Create root user with generated user_id
  // password_hash field has "crypt": "PASSWORD", model layer auto-hashes with bcrypt
  const userData = { 
    ...ROOT_USER, 
    user_id: generateUserId(),
    password_hash: ROOT_USER_PASSWORD,
  };
  const userId = Process("models.__yao.user.Save", userData);
  log.Info(`Root user created: ${ROOT_USER.email} (ID: ${userId}, user_id: ${userData.user_id})`);
}

/**
 * Reset root user - Delete and recreate root user
 * yao run scripts.setup.ResetRootUser
 */
function ResetRootUser() {
  log.Info("Resetting root user...");

  // Delete existing root user
  const deleted = Process("models.__yao.user.DestroyWhere", {
    wheres: [{ column: "email", value: ROOT_USER.email }],
  });
  log.Info(`Deleted ${deleted} root user(s)`);

  // Create new root user with generated user_id
  // password_hash field has "crypt": "PASSWORD", model layer auto-hashes with bcrypt
  const userData = { 
    ...ROOT_USER, 
    user_id: generateUserId(),
    password_hash: ROOT_USER_PASSWORD,
  };
  const userId = Process("models.__yao.user.Save", userData);
  log.Info(`Root user created: ${ROOT_USER.email} (ID: ${userId}, user_id: ${userData.user_id})`);
}
