const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { isFallback } = require('../config/db');
const { syncUpsert, syncDelete, initialSync } = require('../services/supabaseService');

const DB_FILE = path.join(__dirname, '../data/local_db.json');

// Import real Mongoose models
const MongooseModels = {
  User: require('./User'),
  PatientProfile: require('./PatientProfile'),
  DoctorProfile: require('./DoctorProfile'),
  HealthInterview: require('./HealthInterview'),
  HealthResponse: require('./HealthResponse'),
  MedicalDocument: require('./MedicalDocument'),
  MedicalExtraction: require('./MedicalExtraction'),
  HealthSummary: require('./HealthSummary'),
  DoctorRequest: require('./DoctorRequest'),
  Consent: require('./Consent'),
  Prescription: require('./Prescription'),
  Medicine: require('./Medicine'),
  Notification: require('./Notification'),
  MedicalTimeline: require('./MedicalTimeline'),
};

// In-Memory Database Store for robust zero-failure prototype evaluation
class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.data = [];
    this.autoInc = 1000;
  }

  _generateId() {
    this.autoInc += 1;
    return new mongoose.Types.ObjectId().toString();
  }

  _matchesQuery(item, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const [key, val] of Object.entries(query)) {
      if (key === '$or' && Array.isArray(val)) {
        const matchAny = val.some((subQuery) => this._matchesQuery(item, subQuery));
        if (!matchAny) return false;
        continue;
      }
      if (val instanceof RegExp) {
        if (!val.test(String(item[key] || ''))) return false;
        continue;
      }
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        if (val.$regex) {
          const re = new RegExp(val.$regex, val.$options || 'i');
          if (!re.test(String(item[key] || ''))) return false;
          continue;
        }
        if (val.$in && Array.isArray(val.$in)) {
          if (!val.$in.map(String).includes(String(item[key]))) return false;
          continue;
        }
      }
      if (String(item[key]) !== String(val)) {
        return false;
      }
    }
    return true;
  }

  find(query = {}) {
    let results = this.data.filter((item) => this._matchesQuery(item, query));
    const clone = results.map((d) => {
      const copy = { ...d };
      copy.toObject = function () {
        const obj = { ...this };
        delete obj.toObject;
        return obj;
      };
      return copy;
    });

    const chain = {
      _res: clone,
      sort(sortObj) {
        if (sortObj && typeof sortObj === 'object') {
          const key = Object.keys(sortObj)[0];
          const dir = sortObj[key] === -1 || sortObj[key] === 'desc' ? -1 : 1;
          chain._res.sort((a, b) => {
            const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
            const valB = b[key] instanceof Date ? b[key].getTime() : b[key];
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }
        return chain;
      },
      limit(n) {
        chain._res = chain._res.slice(0, n);
        return chain;
      },
      skip(n) {
        chain._res = chain._res.slice(n);
        return chain;
      },
      select() {
        return chain;
      },
      populate() {
        return chain;
      },
      lean() {
        return chain;
      },
      then(resolve, reject) {
        return Promise.resolve(chain._res).then(resolve, reject);
      },
      catch(reject) {
        return Promise.resolve(chain._res).catch(reject);
      },
    };
    return chain;
  }

  async findOne(query = {}) {
    const item = this.data.find((d) => this._matchesQuery(d, query));
    if (!item) return null;
    const res = { ...item };
    res.toObject = function () {
      const obj = { ...this };
      delete obj.toObject;
      return obj;
    };
    return res;
  }

  async findById(id) {
    const item = this.data.find((d) => String(d._id) === String(id));
    if (!item) return null;
    const res = { ...item };
    res.toObject = function () {
      const obj = { ...this };
      delete obj.toObject;
      return obj;
    };
    return res;
  }

  async create(doc) {
    const newDoc = {
      _id: doc._id || this._generateId(),
      ...doc,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
    this.data.push(newDoc);
    if (this.name !== 'Medicine') {
      persistStore();
      syncUpsert(this.name, newDoc).catch(() => {});
    }
    return { ...newDoc };
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const idx = this.data.findIndex((d) => String(d._id) === String(id));
    if (idx === -1) return null;
    const old = this.data[idx];
    const updated = {
      ...old,
      ...(update.$set || update),
      updatedAt: new Date(),
    };
    this.data[idx] = updated;
    if (this.name !== 'Medicine') {
      persistStore();
      syncUpsert(this.name, updated).catch(() => {});
    }
    return { ...updated };
  }

  async findOneAndUpdate(query = {}, update = {}, options = {}) {
    const idx = this.data.findIndex((d) => this._matchesQuery(d, query));
    if (idx === -1) return null;
    const old = this.data[idx];
    const updated = {
      ...old,
      ...(update.$set || update),
      updatedAt: new Date(),
    };
    this.data[idx] = updated;
    if (this.name !== 'Medicine') {
      persistStore();
      syncUpsert(this.name, updated).catch(() => {});
    }
    return { ...updated };
  }

  async countDocuments(query = {}) {
    return this.data.filter((item) => this._matchesQuery(item, query)).length;
  }

  async deleteOne(query = {}) {
    const idx = this.data.findIndex((item) => this._matchesQuery(item, query));
    if (idx !== -1) {
      const removed = this.data.splice(idx, 1)[0];
      if (this.name !== 'Medicine') {
        persistStore();
        if (removed && removed._id) {
          syncDelete(this.name, removed._id).catch(() => {});
        }
      }
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async insertMany(docs = []) {
    const created = [];
    for (const doc of docs) {
      const newDoc = {
        _id: doc._id || this._generateId(),
        ...doc,
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date(),
      };
      this.data.push(newDoc);
      created.push(newDoc);
      if (this.name !== 'Medicine') {
        syncUpsert(this.name, newDoc).catch(() => {});
      }
    }
    if (this.name !== 'Medicine') persistStore();
    return created;
  }

  async updateMany(query = {}, update = {}) {
    let modifiedCount = 0;
    for (let i = 0; i < this.data.length; i++) {
      if (this._matchesQuery(this.data[i], query)) {
        if (update.$set) {
          this.data[i] = { ...this.data[i], ...update.$set, updatedAt: new Date() };
        }
        if (update.$pull) {
          for (const key of Object.keys(update.$pull)) {
            if (Array.isArray(this.data[i][key])) {
              const pullRule = update.$pull[key];
              this.data[i][key] = this.data[i][key].filter((el) => {
                if (typeof pullRule === 'object' && pullRule !== null) {
                  return !this._matchesQuery(el, pullRule);
                }
                return el !== pullRule;
              });
            }
          }
        }
        modifiedCount++;
      }
    }
    if (this.name !== 'Medicine' && modifiedCount > 0) persistStore();
    return { modifiedCount };
  }

  async deleteMany(query = {}) {
    if (!query || Object.keys(query).length === 0) {
      const count = this.data.length;
      this.data = [];
      if (this.name !== 'Medicine') persistStore();
      return { deletedCount: count };
    }
    const initial = this.data.length;
    this.data = this.data.filter((item) => !this._matchesQuery(item, query));
    if (this.name !== 'Medicine') persistStore();
    return { deletedCount: initial - this.data.length };
  }
}

const memoryCollections = {
  User: new MemoryCollection('User'),
  PatientProfile: new MemoryCollection('PatientProfile'),
  DoctorProfile: new MemoryCollection('DoctorProfile'),
  HealthInterview: new MemoryCollection('HealthInterview'),
  HealthResponse: new MemoryCollection('HealthResponse'),
  MedicalDocument: new MemoryCollection('MedicalDocument'),
  MedicalExtraction: new MemoryCollection('MedicalExtraction'),
  HealthSummary: new MemoryCollection('HealthSummary'),
  DoctorRequest: new MemoryCollection('DoctorRequest'),
  Consent: new MemoryCollection('Consent'),
  Prescription: new MemoryCollection('Prescription'),
  Medicine: new MemoryCollection('Medicine'),
  Notification: new MemoryCollection('Notification'),
  MedicalTimeline: new MemoryCollection('MedicalTimeline'),
};

// Persistent File Storage Engine for User Data
let isSaving = false;
let pendingSave = false;

function persistStore() {
  if (isSaving) {
    pendingSave = true;
    return;
  }
  isSaving = true;
  try {
    const exportData = {};
    for (const [colName, col] of Object.entries(memoryCollections)) {
      if (colName === 'Medicine') continue;
      exportData[colName] = col.data;
    }
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(exportData, null, 2), 'utf8');
  } catch (err) {
    console.error('[Database LocalStore] Failed to write local_db.json:', err.message);
  } finally {
    isSaving = false;
    if (pendingSave) {
      pendingSave = false;
      persistStore();
    }
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        for (const [colName, docs] of Object.entries(parsed)) {
          if (memoryCollections[colName] && Array.isArray(docs)) {
            memoryCollections[colName].data = docs;
          }
        }
        console.log(`[Database LocalStore] Loaded persisted records from ${path.basename(DB_FILE)}`);
      }
    } else {
      persistStore();
    }
  } catch (err) {
    console.error('[Database LocalStore] Error loading local_db.json:', err.message);
  }
}

function loadFormulary() {
  try {
    const medPath = path.join(__dirname, '../data/medicines10000.json');
    if (fs.existsSync(medPath)) {
      const rawMeds = JSON.parse(fs.readFileSync(medPath, 'utf8'));
      memoryCollections.Medicine.data = rawMeds.map((m, idx) => ({
        _id: m._id || `med_${idx + 1}`,
        ...m,
      }));
      console.log(`[Database LocalStore] Loaded ${memoryCollections.Medicine.data.length} medicines into formulary store.`);
    }
  } catch (err) {
    console.warn('[Database LocalStore] Notice loading medicines catalog:', err.message);
  }
}

// Initialize on startup
loadFromDisk();
loadFormulary();

// Initiate bi-directional synchronization with Supabase
initialSync(memoryCollections).catch((err) => {
  console.warn('[Supabase Sync Notice]:', err?.message || err);
});

// Model proxy that automatically delegates to Mongoose when connected or Memory store when in fallback mode
const getModel = (name) => {
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (isFallback()) {
          const mem = memoryCollections[name];
          if (typeof mem[prop] === 'function') {
            return mem[prop].bind(mem);
          }
          return mem[prop];
        }
        const realModel = MongooseModels[name];
        if (typeof realModel[prop] === 'function') {
          return realModel[prop].bind(realModel);
        }
        return realModel[prop];
      },
    }
  );
};

module.exports = {
  User: getModel('User'),
  PatientProfile: getModel('PatientProfile'),
  DoctorProfile: getModel('DoctorProfile'),
  HealthInterview: getModel('HealthInterview'),
  HealthResponse: getModel('HealthResponse'),
  MedicalDocument: getModel('MedicalDocument'),
  MedicalExtraction: getModel('MedicalExtraction'),
  HealthSummary: getModel('HealthSummary'),
  DoctorRequest: getModel('DoctorRequest'),
  Consent: getModel('Consent'),
  Prescription: getModel('Prescription'),
  Medicine: getModel('Medicine'),
  Notification: getModel('Notification'),
  MedicalTimeline: getModel('MedicalTimeline'),
  rawMemory: memoryCollections,
  persistStore,
  loadFromDisk,
  syncWithSupabase: () => initialSync(memoryCollections),
};
