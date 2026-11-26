/**
 * MediKiosk Outpatient (OP) Number 12-Hour Persistence Registry
 * 
 * Ensures patient OP numbers and AI health summaries remain fully accessible
 * to doctors for exactly 12 hours after the patient finishes and exits the checkup.
 */

export const OP_VALIDITY_HOURS = 12;
export const OP_EXPIRATION_MS = OP_VALIDITY_HOURS * 60 * 60 * 1000; // 12 hours = 43,200,000 ms

/**
 * Normalize an OP token string (e.g. "447118" -> "OP-447118", "op-447118" -> "OP-447118")
 */
export const normalizeOpNumber = (rawOp) => {
  if (!rawOp) return '';
  let clean = String(rawOp).trim().toUpperCase();
  if (/^\d{6}$/.test(clean)) {
    clean = `OP-${clean}`;
  }
  return clean;
};

/**
 * Save an OP record to durable localStorage with a strict 12-hour expiration window.
 */
export const saveOpRecord = (opNumber, summaryData, patientData = null) => {
  const cleanOp = normalizeOpNumber(opNumber);
  if (!cleanOp) return null;

  const now = Date.now();
  const expiresAt = now + OP_EXPIRATION_MS;

  const patient = patientData || {
    name: summaryData?.patientName || 'Walk-In Patient',
    phoneNumber: summaryData?.patientPhone || '',
    age: summaryData?.patientAge || '',
    gender: summaryData?.patientGender || 'Male',
    bloodGroup: summaryData?.bloodGroup || '',
    abhaId: summaryData?.abhaId || '',
    abhaAddress: summaryData?.abhaAddress || '',
    opNumber: cleanOp,
  };

  const record = {
    opNumber: cleanOp,
    createdAt: now,
    expiresAt,
    expiresAtFormatted: new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    expiresAtDateFormatted: new Date(expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    summary: {
      ...(summaryData || {}),
      opNumber: cleanOp,
      patientName: patient.name || summaryData?.patientName || 'Walk-In Patient',
      patientPhone: patient.phoneNumber || summaryData?.patientPhone || '',
      patientAge: patient.age || summaryData?.patientAge,
      patientGender: patient.gender || summaryData?.patientGender,
      abhaId: patient.abhaId || summaryData?.abhaId || '',
      savedAt: now,
      expiresAt,
    },
    patient,
  };

  try {
    // 1. Read and clean existing registry
    const rawRegistry = localStorage.getItem('medikiosk_op_registry');
    const registry = rawRegistry ? JSON.parse(rawRegistry) : {};

    // Remove records that have already expired
    for (const key of Object.keys(registry)) {
      if (registry[key]?.expiresAt && registry[key].expiresAt < now) {
        delete registry[key];
        localStorage.removeItem(`medikiosk_op_${key}`);
      }
    }

    // 2. Put current record
    registry[cleanOp] = record;
    localStorage.setItem('medikiosk_op_registry', JSON.stringify(registry));

    // 3. Set dedicated direct key for quick 1ms lookup
    localStorage.setItem(`medikiosk_op_${cleanOp}`, JSON.stringify(record));

    // 4. Update last OP pointer
    localStorage.setItem('medikiosk_last_op', cleanOp);
    localStorage.setItem('medikiosk_last_op_record', JSON.stringify(record));
  } catch (err) {
    console.warn('[OP Registry] Local storage write warning:', err);
  }

  return record;
};

/**
 * Retrieve an OP record by OP Number, verifying the 12-hour validity window.
 * Returns record with expiration metadata, or null if not found.
 */
export const getOpRecord = (rawOp) => {
  const cleanOp = normalizeOpNumber(rawOp);
  if (!cleanOp) return null;

  const now = Date.now();

  try {
    // 1. Try direct dedicated key first
    let rawRecord = localStorage.getItem(`medikiosk_op_${cleanOp}`);

    // 2. Fall back to reading from multi-record registry
    if (!rawRecord) {
      const rawRegistry = localStorage.getItem('medikiosk_op_registry');
      if (rawRegistry) {
        const registry = JSON.parse(rawRegistry);
        if (registry[cleanOp]) {
          rawRecord = JSON.stringify(registry[cleanOp]);
        }
      }
    }

    if (!rawRecord) return null;

    const record = JSON.parse(rawRecord);
    const expiresAt = record.expiresAt || (record.createdAt ? record.createdAt + OP_EXPIRATION_MS : now);
    const remainingMs = expiresAt - now;
    const isExpired = remainingMs <= 0;

    const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
    const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

    return {
      ...record,
      isExpired,
      remainingMs,
      remainingHours,
      remainingMinutes,
      remainingLabel: isExpired ? 'Expired' : `${remainingHours}h ${remainingMinutes}m remaining`,
      expiresAtFormatted: new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresAtDateFormatted: new Date(expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    console.warn('[OP Registry] Local storage read warning:', err);
    return null;
  }
};

/**
 * Returns all currently active OP records within their 12-hour lifecycle.
 */
export const getAllActiveOps = () => {
  const now = Date.now();
  const active = [];

  try {
    const rawRegistry = localStorage.getItem('medikiosk_op_registry');
    if (!rawRegistry) return [];
    const registry = JSON.parse(rawRegistry);

    for (const [key, rec] of Object.entries(registry)) {
      if (rec?.expiresAt && rec.expiresAt > now) {
        const remainingMs = rec.expiresAt - now;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        active.push({
          ...rec,
          isExpired: false,
          remainingLabel: `${remainingHours}h ${remainingMinutes}m remaining`,
        });
      }
    }
  } catch (err) {
    console.warn('[OP Registry] Active ops fetch warning:', err);
  }

  return active.sort((a, b) => b.createdAt - a.createdAt);
};
