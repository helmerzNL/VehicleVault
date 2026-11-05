import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  lastLoginAt: text('last_login_at'),
  lastActiveAt: text('last_active_at'),
  twoFactorEnabled: integer('two_factor_enabled').notNull().default(0),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorBackupCodes: text('two_factor_backup_codes'),
  oidcId: text('oidc_id'),
  oidcProvider: text('oidc_provider'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Refresh tokens
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// API keys
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  prefix: text('prefix').notNull(),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').notNull(),
});

// Vehicles table
export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('car'),
  licensePlate: text('license_plate'),
  vin: text('vin'),
  year: integer('year'),
  make: text('make'),
  model: text('model'),
  fuelType: text('fuel_type'),
  purchaseDate: text('purchase_date'),
  purchasePrice: real('purchase_price').default(0),
  initialOdometer: real('initial_odometer').default(0),
  notes: text('notes'),
  status: text('status').notNull().default('active'),
  rdwData: text('rdw_data'),
  apkExpirationDate: text('apk_expiration_date'),
  plateCountry: text('plate_country').notNull().default('NL'),
  imagePath: text('image_path'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Vehicle shares
export const vehicleShares = sqliteTable('vehicle_shares', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('editor'),
  createdAt: text('created_at').notNull(),
});

// Fuel entries
export const fuelEntries = sqliteTable('fuel_entries', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  odometer: real('odometer').notNull(),
  liters: real('liters').notNull(),
  pricePerLiter: real('price_per_liter').notNull(),
  totalCost: real('total_cost').notNull(),
  isFullTank: integer('is_full_tank').notNull().default(1),
  missedPrevious: integer('missed_previous').notNull().default(0),
  notes: text('notes'),
  receiptPath: text('receipt_path'),
  stationName: text('station_name'),
  stationAddress: text('station_address'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  energyType: text('energy_type').notNull().default('fuel'),
  kwh: real('kwh'),
  pricePerKwh: real('price_per_kwh'),
  isTowing: integer('is_towing').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// Service categories
export const serviceCategories = sqliteTable('service_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  isPreset: integer('is_preset').notNull().default(1),
  defaultDistanceInterval: real('default_distance_interval'),
  defaultTimeMonths: integer('default_time_months'),
});

// Maintenance intervals
export const maintenanceIntervals = sqliteTable('maintenance_intervals', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => serviceCategories.id, { onDelete: 'cascade' }),
  customName: text('custom_name'),
  intervalKm: real('interval_km'),
  intervalMonths: integer('interval_months'),
  lastServiceDate: text('last_service_date'),
  lastServiceOdometer: real('last_service_odometer'),
  createdAt: text('created_at').notNull(),
});

// Service records
export const serviceRecords = sqliteTable('service_records', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => serviceCategories.id, { onDelete: 'set null' }),
  maintenanceIntervalId: text('maintenance_interval_id').references(() => maintenanceIntervals.id, { onDelete: 'set null' }),
  maintenanceIntervalIds: text('maintenance_interval_ids'),
  serviceItem: text('service_item').notNull(),
  date: text('date').notNull(),
  odometer: real('odometer').notNull(),
  performingParty: text('performing_party').notNull().default('self'),
  cost: real('cost').notNull().default(0),
  partsCost: real('parts_cost').notNull().default(0),
  laborCost: real('labor_cost').notNull().default(0),
  garageName: text('garage_name'),
  garageAddress: text('garage_address'),
  lineItems: text('line_items'),
  notes: text('notes'),
  invoicePath: text('invoice_path'),
  excludeFromTco: integer('exclude_from_tco').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// Vehicle documents
export const vehicleDocuments = sqliteTable('vehicle_documents', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  documentType: text('document_type').notNull().default('other'),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull().default(0),
  mimeType: text('mime_type').notNull().default('application/pdf'),
  expirationDate: text('expiration_date'),
  notes: text('notes'),
  ocrText: text('ocr_text'),
  linkedServiceRecordId: text('linked_service_record_id').references(() => serviceRecords.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull(),
});

// Fixed expenses
export const fixedExpenses = sqliteTable('fixed_expenses', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  frequency: text('frequency').notNull().default('monthly'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// Tire sets
export const tireSets = sqliteTable('tire_sets', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  season: text('season').notNull(),
  brand: text('brand'),
  model: text('model'),
  size: text('size'),
  dotCode: text('dot_code'),
  isActive: integer('is_active').notNull().default(0),
  installedOdometer: real('installed_odometer'),
  purchaseDate: text('purchase_date'),
  price: real('price').default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// Toll vignettes
export const vignettes = sqliteTable('vignettes', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  country: text('country').notNull(),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  cost: real('cost').notNull().default(0),
  vignetteType: text('vignette_type').notNull().default('electronic'),
  documentPath: text('document_path'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// App Settings
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Better-Auth Core Tables for Standard Protocol
export const authUsers = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const authSessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
});

export const authAccounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const authVerifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

