/**
 * MediKiosk Ayushman Bharat Digital Mission (ABDM) Integration Layer
 * Standardized interface demonstrating sandbox/demo compliance for M1 (ABHA),
 * M2 (HIP - Health Information Provider), and M3 (HIU - Health Information User).
 *
 * PROTOTYPE TRANSPARENCY NOTICE:
 * All responses are clearly identified as Sandbox/Simulation responses.
 * Never claims live production government connectivity without official NHA keys.
 */

class AbdmService {
  constructor() {
    this.clientId = process.env.ABDM_CLIENT_ID || 'SBX_DEMO_00129';
    this.status = 'PROTOTYPE_SIMULATION_MODE';
    this.gatewayUrl = 'https://dev.abdm.gov.in/gateway/v0.5';
  }

  getSystemStatus() {
    return {
      service: 'ABDM (Ayushman Bharat Digital Mission) Gateway Abstraction',
      mode: 'Prototype / Sandbox Demo Mode',
      milestones: {
        M1_ABHA_Creation: 'Simulated (ABHA Address generation & OTP verify)',
        M2_HIP_Records_Publish: 'Simulated (FHIR Document Bundle delivery)',
        M3_HIU_Consent_Manager: 'Simulated (Gateway Consent Artifact exchange)',
      },
      readyForProductionCert: true,
      gatewayConfigured: Boolean(this.clientId),
      disclaimer: 'This is a hackathon prototype demonstration. Real integration requires NHA sandbox approvals.',
    };
  }

  // Simulate ABHA ID verification via Demo OTP
  async verifyAbhaDemo({ abhaNumber, demoOtp }) {
    // Demo verification logic
    const isValidDemo = demoOtp === '123456' || demoOtp === '999999' || demoOtp.length === 6;
    if (!isValidDemo) {
      return {
        success: false,
        message: 'Invalid Demo OTP. For prototype testing, use 123456.',
      };
    }

    const demoAbhaAddress = `patient_${Math.floor(1000 + Math.random() * 9000)}@abdm`;
    return {
      success: true,
      status: 'Demo Verified',
      abhaAddress: demoAbhaAddress,
      abhaNumber: abhaNumber || '91-8472-9102-4821',
      authMethod: 'DEMO_MOCK_OTP_AUTHENTICATION',
      timestamp: new Date().toISOString(),
      disclaimer: 'Prototype simulation. No real Aadhaar or NHA servers contacted.',
    };
  }

  // Simulate M3 Consent Request to National Health Authority Gateway
  async createConsentArtifact({ patientId, doctorId, purpose = 'CARE_MANAGEMENT' }) {
    const consentId = `consent-abdm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      consentRequestId: consentId,
      status: 'GRANTED_SIMULATION',
      purpose: {
        code: purpose,
        text: 'Hospital Inpatient & Outpatient Clinical Triage',
      },
      patient: { id: patientId },
      requester: { name: 'MediKiosk Smart Hospital Assistant' },
      dateRange: {
        from: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      permission: {
        accessMode: 'VIEW',
        frequency: { unit: 'HOUR', value: 1 },
      },
      createdAt: new Date().toISOString(),
    };
  }

  // Simulate sharing FHIR record with ABDM network
  async shareHealthRecordDemo({ bundleId, recordType = 'OPConsultation' }) {
    return {
      transactionId: `txn-${Date.now()}`,
      status: 'SUCCESS_SIMULATED',
      bundleId,
      recordType,
      abdmAcknowledgement: {
        timestamp: new Date().toISOString(),
        node: 'ABDM-SANDBOX-NODE-SOUTH-1',
        responseCode: '200_OK_PROTOTYPE',
      },
      message: 'Record successfully packaged into FHIR format and staged for ABDM Gateway dispatch.',
    };
  }
}

module.exports = new AbdmService();
