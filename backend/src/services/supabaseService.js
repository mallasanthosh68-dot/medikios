/**
 * MediKiosk Supabase Database Integration Service
 * Provides bi-directional synchronization between MediKiosk models
 * and Supabase Cloud PostgreSQL tables for accounts, login, health summaries, and records.
 */

const { supabase, isSupabaseConfigured, testSupabaseConnection } = require('../config/supabase');

// Collection to Supabase Table Mapping
const TABLE_MAP = {
  User: 'users',
  PatientProfile: 'patient_profiles',
  DoctorProfile: 'doctor_profiles',
  HealthInterview: 'health_interviews',
  HealthSummary: 'health_summaries',
  MedicalDocument: 'medical_documents',
  MedicalExtraction: 'medical_extractions',
  Prescription: 'prescriptions',
  DoctorRequest: 'doctor_requests',
  MedicalTimeline: 'medical_timeline',
  Notification: 'notifications',
  Consent: 'consents',
};

// Convert camelCase object to snake_case for PostgreSQL
const toSnakeCase = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Convert snake_case object to camelCase for Mongoose models
const toCamelCase = (str) =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

/**
 * Transforms a Mongoose / JavaScript doc into a Supabase table row
 */
const transformForSupabase = (collectionName, doc) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const row = {};

  // Standard ID conversion
  row.id = String(raw._id || raw.id);

  for (const [key, val] of Object.entries(raw)) {
    if (key === '_id' || key === 'toObject') continue;

    // Special field name mappings
    let dbKey = toSnakeCase(key);
    if (collectionName === 'User' && key === 'password') {
      dbKey = 'password_hash';
    }

    // JSONB object or array serialization
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      row[dbKey] = val;
    } else if (val instanceof Date) {
      row[dbKey] = val.toISOString();
    } else {
      row[dbKey] = val;
    }
  }

  if (!row.created_at) row.created_at = new Date().toISOString();
  if (!row.updated_at) row.updated_at = new Date().toISOString();

  return row;
};

/**
 * Transforms a Supabase table row into a Mongoose / JavaScript model doc
 */
const transformFromSupabase = (collectionName, row) => {
  if (!row) return null;
  const doc = {};
  doc._id = String(row.id);

  for (const [key, val] of Object.entries(row)) {
    if (key === 'id') continue;
    let modelKey = toCamelCase(key);
    if (collectionName === 'User' && key === 'password_hash') {
      modelKey = 'password';
    }
    doc[modelKey] = val;
  }

  doc.toObject = function () {
    const obj = { ...this };
    delete obj.toObject;
    return obj;
  };

  return doc;
};

/**
 * Upserts a document to its corresponding Supabase table
 */
const syncUpsert = async (collectionName, doc) => {
  if (!isSupabaseConfigured() || !supabase) return null;
  const tableName = TABLE_MAP[collectionName];
  if (!tableName) return null;

  try {
    const row = transformForSupabase(collectionName, doc);
    if (!row || !row.id) return null;

    const { data, error } = await supabase
      .from(tableName)
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn(`[Supabase Sync Warning] Failed to upsert ${collectionName} (${row.id}):`, error.message);
      return null;
    }
    return row;
  } catch (err) {
    console.warn(`[Supabase Sync Error] Exception during upsert on ${collectionName}:`, err.message);
    return null;
  }
};

/**
 * Deletes a document from its corresponding Supabase table
 */
const syncDelete = async (collectionName, id) => {
  if (!isSupabaseConfigured() || !supabase || !id) return null;
  const tableName = TABLE_MAP[collectionName];
  if (!tableName) return null;

  try {
    const { error } = await supabase.from(tableName).delete().eq('id', String(id));
    if (error) {
      console.warn(`[Supabase Sync Warning] Failed to delete from ${collectionName} (${id}):`, error.message);
    }
  } catch (err) {
    console.warn(`[Supabase Sync Error] Exception during delete on ${collectionName}:`, err.message);
  }
};

/**
 * Performs initial sync on backend startup:
 * 1. Pulls existing accounts, profiles, health summaries, and documents from Supabase.
 * 2. If Supabase is empty but local disk has records, pushes local records to Supabase.
 */
const initialSync = async (memoryCollections) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { synced: false, reason: 'Supabase credentials not configured.' };
  }

  console.log('[Supabase Sync] Initiating bi-directional synchronization with Cloud PostgreSQL...');
  let totalLoaded = 0;
  let totalPushed = 0;

  for (const [colName, tableName] of Object.entries(TABLE_MAP)) {
    const collection = memoryCollections[colName];
    if (!collection) continue;

    try {
      // 1. Fetch remote records from Supabase
      const { data: remoteRows, error } = await supabase.from(tableName).select('*');

      if (!error && Array.isArray(remoteRows) && remoteRows.length > 0) {
        // Hydrate local collection from Supabase
        const remoteDocs = remoteRows.map((r) => transformFromSupabase(colName, r));
        const localMap = new Map();
        collection.data.forEach((d) => localMap.set(String(d._id), d));

        remoteDocs.forEach((rDoc) => {
          localMap.set(String(rDoc._id), rDoc);
        });

        collection.data = Array.from(localMap.values());
        totalLoaded += remoteRows.length;
        console.log(`[Supabase Sync] ✓ Pulled ${remoteRows.length} ${colName} record(s) from Supabase table "${tableName}".`);
      } else if (collection.data && collection.data.length > 0) {
        // 2. Supabase table is empty or has fewer records; seed remote from local
        const rowsToPush = collection.data.map((d) => transformForSupabase(colName, d)).filter(Boolean);
        if (rowsToPush.length > 0) {
          const { error: pushErr } = await supabase.from(tableName).upsert(rowsToPush, { onConflict: 'id' });
          if (!pushErr) {
            totalPushed += rowsToPush.length;
            console.log(`[Supabase Sync] ⬆ Pushed ${rowsToPush.length} local ${colName} record(s) to Supabase table "${tableName}".`);
          }
        }
      }
    } catch (colErr) {
      console.warn(`[Supabase Sync Warning] Sync failed for ${colName}:`, colErr.message);
    }
  }

  console.log(`[Supabase Sync] Complete! Hydrated ${totalLoaded} records from cloud | Pushed ${totalPushed} records.`);
  return { synced: true, loaded: totalLoaded, pushed: totalPushed };
};

module.exports = {
  TABLE_MAP,
  isConfigured: isSupabaseConfigured,
  testConnection: testSupabaseConnection,
  syncUpsert,
  syncDelete,
  initialSync,
  transformForSupabase,
  transformFromSupabase,
};
