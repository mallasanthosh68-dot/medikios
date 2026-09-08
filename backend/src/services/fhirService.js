/**
 * MediKiosk FHIR Interoperability Service (FHIR Release 4)
 * Maps internal clinical models into standardized HL7 FHIR R4 resources:
 * - Patient
 * - Practitioner
 * - Observation (vitals, lab metrics)
 * - Condition (reported diagnoses, chief complaint)
 * - MedicationRequest (prescriptions)
 * - DiagnosticReport (lab reports)
 * - DocumentReference (uploaded scans)
 *
 * Prototype Note: Demonstrates structural interoperability mapping for SIH.
 * Production systems must be certified against official NRCeS / HL7 India profiles.
 */

const generateFhirBundle = ({
  patient,
  doctor = null,
  summary = null,
  prescription = null,
  document = null,
  extraction = null,
}) => {
  const patientId = String(patient._id || patient.id || 'patient-demo-001');
  const bundleId = `bundle-medikiosk-${Date.now()}`;

  const entries = [];

  // 1. FHIR Patient Resource
  const fhirPatient = {
    fullUrl: `urn:uuid:patient-${patientId}`,
    resource: {
      resourceType: 'Patient',
      id: patientId,
      identifier: [
        {
          system: 'https://healthid.ndhm.gov.in',
          value: patient.aadhaarDemoId || '91-DEMO-ABHA-4982',
          use: 'secondary',
        },
      ],
      active: true,
      name: [
        {
          use: 'official',
          text: patient.name || 'Demo Patient',
        },
      ],
      telecom: [
        {
          system: 'phone',
          value: patient.phoneNumber || '9876543210',
          use: 'mobile',
        },
      ],
      gender: (patient.gender || 'other').toLowerCase(),
      birthDate: patient.age ? `${new Date().getFullYear() - patient.age}-01-01` : '1990-01-01',
    },
  };
  entries.push(fhirPatient);

  // 2. FHIR Practitioner (Doctor) Resource
  if (doctor) {
    const docId = String(doctor._id || doctor.id || 'doctor-demo-001');
    entries.push({
      fullUrl: `urn:uuid:practitioner-${docId}`,
      resource: {
        resourceType: 'Practitioner',
        id: docId,
        identifier: [
          {
            system: 'https://nmc.org.in/registration',
            value: doctor.licenseNumber || 'MCI-DEMO-78912',
          },
        ],
        name: [{ text: doctor.doctorName || doctor.name || 'Dr. Attending' }],
        qualification: [
          {
            code: {
              text: doctor.specialization || 'General Medicine',
            },
          },
        ],
      },
    });
  }

  // 3. FHIR Condition (Chief Complaint / Health Issue)
  if (summary && summary.chiefComplaint) {
    entries.push({
      fullUrl: `urn:uuid:condition-${summary._id || Date.now()}`,
      resource: {
        resourceType: 'Condition',
        id: `condition-${summary._id || '01'}`,
        clinicalStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
        },
        verificationStatus: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'provisional' }],
        },
        category: [
          {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis' }],
          },
        ],
        code: {
          text: summary.chiefComplaint,
        },
        subject: {
          reference: `Patient/${patientId}`,
          display: patient.name,
        },
        recordedDate: new Date().toISOString(),
      },
    });
  }

  // 4. FHIR Observations (Lab extraction metrics)
  if (extraction && extraction.structuredData && extraction.structuredData.labTests) {
    extraction.structuredData.labTests.forEach((lab, idx) => {
      entries.push({
        fullUrl: `urn:uuid:obs-${idx}-${Date.now()}`,
        resource: {
          resourceType: 'Observation',
          id: `obs-${idx}`,
          status: 'final',
          category: [
            {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }],
            },
          ],
          code: {
            text: lab.testName,
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          valueQuantity: {
            value: parseFloat(lab.value) || lab.value,
            unit: lab.unit,
            system: 'http://unitsofmeasure.org',
          },
          interpretation: [
            {
              text: lab.status || 'Normal',
            },
          ],
        },
      });
    });
  }

  // 5. FHIR MedicationRequest (Digital Prescriptions)
  if (prescription && prescription.medicines) {
    prescription.medicines.forEach((med, idx) => {
      entries.push({
        fullUrl: `urn:uuid:medreq-${idx}-${Date.now()}`,
        resource: {
          resourceType: 'MedicationRequest',
          id: `medreq-${idx}`,
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            text: `${med.name} ${med.strength || ''}`,
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          authoredOn: new Date().toISOString(),
          dosageInstruction: [
            {
              text: `${med.dosage} ${med.frequency} for ${med.duration}`,
            },
          ],
        },
      });
    });
  }

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'document',
    timestamp: new Date().toISOString(),
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle'],
      tag: [
        {
          system: 'http://medikiosk.internal/system',
          code: 'PROTOTYPE_DEMO_INTEROPERABILITY',
          display: 'MediKiosk Demo Interoperability Profile',
        },
      ],
    },
    total: entries.length,
    entry: entries,
  };
};

module.exports = {
  generateFhirBundle,
};
