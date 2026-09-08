/**
 * MediKiosk Hospital Information System (HIS) Integration Layer
 * Provides an architectural bridge for EMRs like OpenEMR, Epic, Cerner,
 * or custom Indian government hospital HIS backends.
 *
 * PROTOTYPE NOTICE: Operates strictly in Demo Mode.
 */

class HisService {
  constructor() {
    this.hisEndpoint = process.env.HIS_API_URL || 'https://his-demo.internal.hospital/api/v1';
    this.status = 'DEMO_SIMULATION_MODE';
    this.hospitalName = 'MediKiosk Apex Tertiary Hospital (Demo)';
  }

  getStatus() {
    return {
      service: 'Hospital Information System (HIS) Enterprise Gateway',
      status: 'Demo Mode',
      hospital: this.hospitalName,
      connectedDepartmentQueue: 'OPD_TRIAGE_CENTRAL_01',
      supportedProtocols: ['HL7 v2.x (ADT/ORM)', 'FHIR R4 REST', 'DICOM Web C-STORE'],
      disclaimer: 'Demonstration interface. Requires formal enterprise HIS credentials for production hospital networks.',
    };
  }

  // Simulate pushing an admission or triage ticket to HIS OPD Queue
  async pushTriageEncounter({ patientId, patientName, priority = 'NORMAL', suggestedSpecialty, summaryId }) {
    const hisOpdToken = `OPD-TOKEN-${Math.floor(100 + Math.random() * 900)}`;
    return {
      success: true,
      status: 'Demo Mode — Ticket Created',
      hisOpdToken,
      assignedDepartment: suggestedSpecialty || 'General Medicine',
      triagePriority: priority === 'HIGH_PRIORITY' ? 'RED_FLAG_URGENT' : 'STANDARD_QUEUE',
      hospitalBedWing: 'OPD Ground Floor Block C',
      summaryLinked: summaryId,
      timestamp: new Date().toISOString(),
      instructions: `Please proceed to counter 3 or OPD room for ${suggestedSpecialty}.`,
    };
  }

  // Simulate fetching recent hospital lab tests from HIS EMR
  async fetchHospitalEmrHistory({ patientPhone }) {
    return {
      success: true,
      status: 'Demo Mode',
      source: 'Hospital Centric EMR Core',
      recordsFound: 2,
      records: [
        {
          encounterId: 'ENC-2024-891',
          date: '2024-11-14',
          department: 'Outpatient Triage',
          physician: 'Dr. A. Sharma, MD',
          diagnosis: 'Acute Gastritis / Acid Peptic Disease',
          labOrders: ['Complete Blood Count', 'Ultrasound Abdomen'],
        },
        {
          encounterId: 'ENC-2023-412',
          date: '2023-08-20',
          department: 'Preventive Health',
          physician: 'Dr. Priya Menon, MBBS',
          diagnosis: 'Routine Annual Wellness Screening',
          labOrders: ['Lipid Profile', 'Fasting Blood Sugar'],
        },
      ],
    };
  }
}

module.exports = new HisService();
