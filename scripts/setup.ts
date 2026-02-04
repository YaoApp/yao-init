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

  // Run migrate first to ensure tables exist
  log.Info("Running database migration...");
  MigrateModels();

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
 * Generate a 12-digit numeric ID
 */
function generateId(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return timestamp + random;
}

const ROOT_USER_PASSWORD = "Yao123++";

const ROOT_USER = {
  email: "root@yaoagents.com",
  name: "Administrator",
  status: "active",
  role_id: "system:root",
  type: "selfhosting",
  locale: "en-us",
};

const ROOT_TEAM = {
  name: "Default",
  display_name: "Default Team",
  description: "Default team",
  status: "active",
  type: "other",
  is_verified: true,
  role_id: "system:root", // Team role (same as root user)
};

/**
 * Setup root user with team - Create root user, team and membership if not exists
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

  // Generate IDs
  const userId = generateId();
  const teamId = generateId();
  const memberId = generateId();

  // Create root user with generated user_id
  // password_hash field has "crypt": "PASSWORD", model layer auto-hashes with bcrypt
  const userData = {
    ...ROOT_USER,
    user_id: userId,
    password_hash: ROOT_USER_PASSWORD,
  };
  const userPK = Process("models.__yao.user.Save", userData);
  log.Info(`Root user created: ${ROOT_USER.email} (ID: ${userPK}, user_id: ${userId})`);

  // Create root team
  const teamData = {
    ...ROOT_TEAM,
    team_id: teamId,
    owner_id: userId,
    contact_email: ROOT_USER.email,
  };
  const teamPK = Process("models.__yao.team.Save", teamData);
  log.Info(`Root team created: ${ROOT_TEAM.name} (ID: ${teamPK}, team_id: ${teamId})`);

  // Add root user as team owner member
  const memberData = {
    member_id: memberId,
    team_id: teamId,
    user_id: userId,
    member_type: "user",
    display_name: ROOT_USER.name,
    email: ROOT_USER.email,
    role_id: "team:owner",
    is_owner: true,
    status: "active",
    joined_at: new Date().toISOString(),
  };
  const memberPK = Process("models.__yao.member.Save", memberData);
  log.Info(`Root user added to team as owner (ID: ${memberPK}, member_id: ${memberId})`);
}

/**
 * Reset root user - Delete and recreate root user, team and membership
 * yao run scripts.setup.ResetRootUser
 */
function ResetRootUser() {
  log.Info("Resetting root user...");

  // Get existing root user to find user_id for cleanup
  const existingUser = Process("models.__yao.user.Get", {
    wheres: [{ column: "email", value: ROOT_USER.email }],
    limit: 1,
  });

  if (existingUser && existingUser.length > 0) {
    const oldUserId = existingUser[0].user_id;

    // Delete member records for this user
    const deletedMembers = Process("models.__yao.member.DestroyWhere", {
      wheres: [{ column: "user_id", value: oldUserId }],
    });
    log.Info(`Deleted ${deletedMembers} member record(s)`);

    // Delete teams owned by this user
    const deletedTeams = Process("models.__yao.team.DestroyWhere", {
      wheres: [{ column: "owner_id", value: oldUserId }],
    });
    log.Info(`Deleted ${deletedTeams} team(s)`);
  }

  // Delete existing root user
  const deletedUsers = Process("models.__yao.user.DestroyWhere", {
    wheres: [{ column: "email", value: ROOT_USER.email }],
  });
  log.Info(`Deleted ${deletedUsers} root user(s)`);

  // Generate new IDs
  const userId = generateId();
  const teamId = generateId();
  const memberId = generateId();

  // Create new root user with generated user_id
  // password_hash field has "crypt": "PASSWORD", model layer auto-hashes with bcrypt
  const userData = {
    ...ROOT_USER,
    user_id: userId,
    password_hash: ROOT_USER_PASSWORD,
  };
  const userPK = Process("models.__yao.user.Save", userData);
  log.Info(`Root user created: ${ROOT_USER.email} (ID: ${userPK}, user_id: ${userId})`);

  // Create root team
  const teamData = {
    ...ROOT_TEAM,
    team_id: teamId,
    owner_id: userId,
    contact_email: ROOT_USER.email,
  };
  const teamPK = Process("models.__yao.team.Save", teamData);
  log.Info(`Root team created: ${ROOT_TEAM.name} (ID: ${teamPK}, team_id: ${teamId})`);

  // Add root user as team owner member
  const memberData = {
    member_id: memberId,
    team_id: teamId,
    user_id: userId,
    member_type: "user",
    display_name: ROOT_USER.name,
    email: ROOT_USER.email,
    role_id: "team:owner",
    is_owner: true,
    status: "active",
    joined_at: new Date().toISOString(),
  };
  const memberPK = Process("models.__yao.member.Save", memberData);
  log.Info(`Root user added to team as owner (ID: ${memberPK}, member_id: ${memberId})`);
}
