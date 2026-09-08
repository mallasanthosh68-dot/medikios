const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const {
  User,
  DoctorProfile,
  PatientProfile,
  Medicine,
  MedicalTimeline,
  Prescription,
  HealthSummary,
  MedicalDocument,
  Notification,
} = require('../models');

// 110 Comprehensive Demo Medicines
const SAMPLE_MEDICINES = [
  // Analgesics & Antipyretics
  { medicineName: 'Dolo 650', genericName: 'Paracetamol', strength: '650 mg', form: 'Tablet', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Crocin Advance', genericName: 'Paracetamol', strength: '500 mg', form: 'Tablet', category: 'Antipyretic' },
  { medicineName: 'Combiflam', genericName: 'Ibuprofen + Paracetamol', strength: '400mg + 325mg', form: 'Tablet', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Brufen 400', genericName: 'Ibuprofen', strength: '400 mg', form: 'Tablet', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Voveran SR 100', genericName: 'Diclofenac Sodium', strength: '100 mg', form: 'Tablet', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Volini Gel', genericName: 'Diclofenac Diethylamine', strength: '1.16 % w/w', form: 'Gel', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Ultracet', genericName: 'Tramadol + Paracetamol', strength: '37.5mg + 325mg', form: 'Tablet', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Meftal-Spas', genericName: 'Mefenamic Acid + Dicyclomine', strength: '250mg + 10mg', form: 'Tablet', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Zerodol-SP', genericName: 'Aceclofenac + Paracetamol + Serratiopeptidase', strength: '100mg + 325mg + 15mg', form: 'Tablet', category: 'Analgesic / Pain Relief' },
  { medicineName: 'Calpol 250 Paediatric', genericName: 'Paracetamol Suspension', strength: '250 mg / 5ml', form: 'Syrup', category: 'Antipyretic' },

  // Antibiotics & Anti-Infectives
  { medicineName: 'Augmentin 625 Duo', genericName: 'Amoxicillin + Clavulanic Acid', strength: '500mg + 125mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Moxikind-CV 625', genericName: 'Amoxicillin + Clavulanate', strength: '625 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Azithral 500', genericName: 'Azithromycin', strength: '500 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Zady 250', genericName: 'Azithromycin', strength: '250 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Ciplox 500', genericName: 'Ciprofloxacin', strength: '500 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Oflox 200', genericName: 'Ofloxacin', strength: '200 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Zenflox-OZ', genericName: 'Ofloxacin + Ornidazole', strength: '200mg + 500mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Taxim-O 200', genericName: 'Cefixime', strength: '200 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Monocef 1g Injection', genericName: 'Ceftriaxone Sodium', strength: '1000 mg', form: 'Injection', category: 'Antibiotic' },
  { medicineName: 'Cefakind 500', genericName: 'Cefuroxime Axetil', strength: '500 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Doxy-1 L-DR', genericName: 'Doxycycline + Lactic Acid Bacillus', strength: '100 mg', form: 'Capsule', category: 'Antibiotic' },
  { medicineName: 'Metrogyl 400', genericName: 'Metronidazole', strength: '400 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Flagyl 200', genericName: 'Metronidazole Suspension', strength: '200 mg / 5ml', form: 'Syrup', category: 'Antibiotic' },
  { medicineName: 'Levomac 500', genericName: 'Levofloxacin', strength: '500 mg', form: 'Tablet', category: 'Antibiotic' },
  { medicineName: 'Rifaximin 400', genericName: 'Rifaximin', strength: '400 mg', form: 'Tablet', category: 'Antibiotic' },

  // Antacids, PPIs & Gastrointestinal
  { medicineName: 'Pan 40', genericName: 'Pantoprazole', strength: '40 mg', form: 'Tablet', category: 'Antacid / PPI' },
  { medicineName: 'Pantocid DSR', genericName: 'Pantoprazole + Domperidone', strength: '40mg + 30mg', form: 'Capsule', category: 'Antacid / PPI' },
  { medicineName: 'Razo 20', genericName: 'Rabeprazole Sodium', strength: '20 mg', form: 'Tablet', category: 'Antacid / PPI' },
  { medicineName: 'Rabemac-DSR', genericName: 'Rabeprazole + Domperidone', strength: '20mg + 30mg', form: 'Capsule', category: 'Antacid / PPI' },
  { medicineName: 'Omez 20', genericName: 'Omeprazole', strength: '20 mg', form: 'Capsule', category: 'Antacid / PPI' },
  { medicineName: 'Nexpro 40', genericName: 'Esomeprazole', strength: '40 mg', form: 'Tablet', category: 'Antacid / PPI' },
  { medicineName: 'Gelusil MPS', genericName: 'Aluminium Hydroxide + Magnesium + Simethicone', strength: 'Standard', form: 'Syrup', category: 'Antacid / PPI' },
  { medicineName: 'Digene Gel', genericName: 'Magnesium Hydroxide + Simethicone', strength: '200 ml bottle', form: 'Syrup', category: 'Antacid / PPI' },
  { medicineName: 'Sucrafil Suspension', genericName: 'Sucralfate', strength: '1000 mg / 10ml', form: 'Suspension', category: 'Gastrointestinal' },
  { medicineName: 'Emeset 4', genericName: 'Ondansetron', strength: '4 mg', form: 'Tablet', category: 'Antiemetic' },
  { medicineName: 'Vomikind 4mg Fast Melt', genericName: 'Ondansetron MD', strength: '4 mg', form: 'Tablet', category: 'Antiemetic' },
  { medicineName: 'Cremaffin Plus', genericName: 'Liquid Paraffin + Milk of Magnesia', strength: '225 ml', form: 'Syrup', category: 'Gastrointestinal' },
  { medicineName: 'Isabgol Husk Powder', genericName: 'Psyllium Husk', strength: '100 gm pack', form: 'Suspension', category: 'Gastrointestinal' },
  { medicineName: 'Econorm Sachet', genericName: 'Saccharomyces Boulardii', strength: '250 mg', form: 'Suspension', category: 'Gastrointestinal' },
  { medicineName: 'Darolac Capsule', genericName: 'Probiotic Blend (Lactobacillus)', strength: 'Standard', form: 'Capsule', category: 'Gastrointestinal' },

  // Antihypertensives & Cardiovascular
  { medicineName: 'Telma 40', genericName: 'Telmisartan', strength: '40 mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Telma-H', genericName: 'Telmisartan + Hydrochlorothiazide', strength: '40mg + 12.5mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Telmikind-AM', genericName: 'Telmisartan + Amlodipine', strength: '40mg + 5mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Amlong 5', genericName: 'Amlodipine Besylate', strength: '5 mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Amlokind-AT', genericName: 'Amlodipine + Atenolol', strength: '5mg + 50mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Cilacar 10', genericName: 'Cilnidipine', strength: '10 mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Cardivas 3.125', genericName: 'Carvedilol', strength: '3.125 mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Betaloc 25', genericName: 'Metoprolol Succinate', strength: '25 mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Envas 5', genericName: 'Enalapril Maleate', strength: '5 mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Losar 50', genericName: 'Losartan Potassium', strength: '50 mg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Arkamin 100', genericName: 'Clonidine Hydrochloride', strength: '100 mcg', form: 'Tablet', category: 'Antihypertensive' },
  { medicineName: 'Atorva 10', genericName: 'Atorvastatin Calcium', strength: '10 mg', form: 'Tablet', category: 'Cardiovascular / Statin' },
  { medicineName: 'Atorva 20', genericName: 'Atorvastatin Calcium', strength: '20 mg', form: 'Tablet', category: 'Cardiovascular / Statin' },
  { medicineName: 'Rosuvas 10', genericName: 'Rosuvastatin', strength: '10 mg', form: 'Tablet', category: 'Cardiovascular / Statin' },
  { medicineName: 'Rosuvas-F 10', genericName: 'Rosuvastatin + Fenofibrate', strength: '10mg + 160mg', form: 'Tablet', category: 'Cardiovascular / Statin' },
  { medicineName: 'Ecosprin 75', genericName: 'Aspirin (Enteric Coated)', strength: '75 mg', form: 'Tablet', category: 'Cardiovascular / Statin' },
  { medicineName: 'Ecosprin 150', genericName: 'Aspirin (Enteric Coated)', strength: '150 mg', form: 'Tablet', category: 'Cardiovascular / Statin' },
  { medicineName: 'Clavix 75', genericName: 'Clopidogrel Bisulphate', strength: '75 mg', form: 'Tablet', category: 'Cardiovascular / Statin' },
  { medicineName: 'Sorbitrate 5', genericName: 'Isosorbide Dinitrate', strength: '5 mg', form: 'Tablet', category: 'Cardiovascular / Statin' },

  // Antidiabetics
  { medicineName: 'Glycomet 500', genericName: 'Metformin Hydrochloride', strength: '500 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Glycomet-SR 1000', genericName: 'Metformin Sustained Release', strength: '1000 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Glucobay 50', genericName: 'Acarbose', strength: '50 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Amaryl 1mg', genericName: 'Glimepiride', strength: '1 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Amaryl 2mg', genericName: 'Glimepiride', strength: '2 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Gemer 2', genericName: 'Glimepiride + Metformin', strength: '2mg + 500mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Januvia 100', genericName: 'Sitagliptin', strength: '100 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Janumet 50/500', genericName: 'Sitagliptin + Metformin', strength: '50mg + 500mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Galvus 50', genericName: 'Vildagliptin', strength: '50 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Galvus Met 50/500', genericName: 'Vildagliptin + Metformin', strength: '50mg + 500mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Forxiga 10', genericName: 'Dapagliflozin', strength: '10 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Jardiance 10', genericName: 'Empagliflozin', strength: '10 mg', form: 'Tablet', category: 'Antidiabetic' },
  { medicineName: 'Mixtard 30/70 Penfill', genericName: 'Human Biphasic Isophane Insulin', strength: '100 IU/ml (3ml)', form: 'Injection', category: 'Antidiabetic' },
  { medicineName: 'Lantus SoloStar', genericName: 'Insulin Glargine', strength: '100 IU/ml (3ml)', form: 'Injection', category: 'Antidiabetic' },

  // Respiratory & Antihistamines
  { medicineName: 'Allegra 120', genericName: 'Fexofenadine HCl', strength: '120 mg', form: 'Tablet', category: 'Antihistamine' },
  { medicineName: 'Allegra 180', genericName: 'Fexofenadine HCl', strength: '180 mg', form: 'Tablet', category: 'Antihistamine' },
  { medicineName: 'Levocet 5', genericName: 'Levocetirizine', strength: '5 mg', form: 'Tablet', category: 'Antihistamine' },
  { medicineName: 'Montair-LC', genericName: 'Montelukast + Levocetirizine', strength: '10mg + 5mg', form: 'Tablet', category: 'Antihistamine' },
  { medicineName: 'Cetzine 10', genericName: 'Cetirizine Hydrochloride', strength: '10 mg', form: 'Tablet', category: 'Antihistamine' },
  { medicineName: 'Avil 25', genericName: 'Pheniramine Maleate', strength: '25 mg', form: 'Tablet', category: 'Antihistamine' },
  { medicineName: 'Asthalin Inhaler', genericName: 'Salbutamol Inhalation Aerosol', strength: '100 mcg / puff', form: 'Inhaler', category: 'Bronchodilator / Respiratory' },
  { medicineName: 'Budecort 200 Inhaler', genericName: 'Budesonide Inhalation Aerosol', strength: '200 mcg', form: 'Inhaler', category: 'Bronchodilator / Respiratory' },
  { medicineName: 'Foracort 200 Rotacaps', genericName: 'Formoterol + Budesonide', strength: '6mcg + 200mcg', form: 'Inhaler', category: 'Bronchodilator / Respiratory' },
  { medicineName: 'Deriphyllin Retard 150', genericName: 'Theophylline + Etofylline', strength: '150 mg', form: 'Tablet', category: 'Bronchodilator / Respiratory' },
  { medicineName: 'Ascoril D Plus', genericName: 'Dextromethorphan + Phenylephrine + CPM', strength: '100 ml bottle', form: 'Syrup', category: 'Cough & Cold' },
  { medicineName: 'Ascoril LS Syrup', genericName: 'Levosalbutamol + Ambroxol + Guaiphenesin', strength: '100 ml bottle', form: 'Syrup', category: 'Cough & Cold' },
  { medicineName: 'Benadryl Cough Formula', genericName: 'Diphenhydramine + Ammonium Chloride', strength: '100 ml bottle', form: 'Syrup', category: 'Cough & Cold' },
  { medicineName: 'Otrivin Oxy Nasal Spray', genericName: 'Oxymetazoline Hydrochloride', strength: '0.05 % w/v', form: 'Drops', category: 'Cough & Cold' },

  // Vitamins, Minerals & Neurological
  { medicineName: 'Becosules Z', genericName: 'B-Complex with Vitamin C and Zinc', strength: 'Standard Therapeutic', form: 'Capsule', category: 'Vitamin / Supplement' },
  { medicineName: 'Neurobion Forte', genericName: 'Vitamin B1 + B6 + B12', strength: 'High Potency', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Supradyn Daily', genericName: 'Multivitamins + Trace Minerals', strength: 'Standard Daily', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Shelcal 500', genericName: 'Calcium Carbonate + Vitamin D3', strength: '500mg + 250 IU', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Uprise D3 60K', genericName: 'Cholecalciferol (Vitamin D3)', strength: '60,000 IU', form: 'Capsule', category: 'Vitamin / Supplement' },
  { medicineName: 'Limcee 500', genericName: 'Ascorbic Acid (Vitamin C)', strength: '500 mg Chewable', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Orofer XT', genericName: 'Ferrous Ascorbate + Folic Acid', strength: '100mg + 1.5mg', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Folvite 5mg', genericName: 'Folic Acid', strength: '5 mg', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Zincovit Tablet', genericName: 'Multivitamin + Multimineral with Grape Seed', strength: 'Standard', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Cobadex CZS', genericName: 'Cyanocobalamin, Chromium, Zinc', strength: 'Standard', form: 'Tablet', category: 'Vitamin / Supplement' },
  { medicineName: 'Gabapin NT', genericName: 'Gabapentin + Nortriptyline', strength: '400mg + 10mg', form: 'Tablet', category: 'Neurological' },
  { medicineName: 'Pregabalin 75', genericName: 'Pregabalin', strength: '75 mg', form: 'Capsule', category: 'Neurological' },
  { medicineName: 'Vertin 16', genericName: 'Betahistine Dihydrochloride', strength: '16 mg', form: 'Tablet', category: 'Neurological' },
  { medicineName: 'Stugeron 25', genericName: 'Cinnarizine', strength: '25 mg', form: 'Tablet', category: 'Neurological' },
  { medicineName: 'Ciplar 10', genericName: 'Propranolol Hydrochloride', strength: '10 mg', form: 'Tablet', category: 'Neurological' },

  // Dermatological & Topical
  { medicineName: 'Betnovate-C', genericName: 'Betamethasone + Clioquinol', strength: '20 gm tube', form: 'Cream', category: 'Dermatological' },
  { medicineName: 'Candid-B Cream', genericName: 'Clotrimazole + Beclomethasone', strength: '20 gm tube', form: 'Cream', category: 'Dermatological' },
  { medicineName: 'Quadriderm RF', genericName: 'Beclomethasone + Clotrimazole + Neomycin', strength: '15 gm tube', form: 'Cream', category: 'Dermatological' },
  { medicineName: 'T-Bact 2% Ointment', genericName: 'Mupirocin', strength: '2 % w/w (5g)', form: 'Ointment', category: 'Dermatological' },
  { medicineName: 'Silverex Ionic Gel', genericName: 'Silver Sulfadiazine', strength: '20 gm tube', form: 'Gel', category: 'Dermatological' },
  { medicineName: 'Calamine Lotion IP', genericName: 'Calamine + Zinc Oxide', strength: '100 ml bottle', form: 'Suspension', category: 'Dermatological' },
  { medicineName: 'Moiz Cleansing Lotion', genericName: 'Cetyl Alcohol + Stearyl Alcohol', strength: '200 ml', form: 'Suspension', category: 'Dermatological' },
  { medicineName: 'Soframycin Skin Cream', genericName: 'Framycetin Sulphate', strength: '1 % w/w (30g)', form: 'Cream', category: 'Dermatological' },
  { medicineName: 'Ketocip 2% Shampoo', genericName: 'Ketoconazole', strength: '100 ml bottle', form: 'Suspension', category: 'Dermatological' },
  { medicineName: 'Bactroban Ointment', genericName: 'Mupirocin', strength: '15 gm tube', form: 'Ointment', category: 'Dermatological' },
];

// 8 Verified Demo Doctors
const SAMPLE_DOCTORS = [
  {
    name: 'Dr. Rajesh Iyer',
    phone: '9876543201',
    password: 'Password@123',
    licenseNumber: 'MCI-CARDIO-49821',
    specialization: 'Cardiology',
    experienceYears: 14,
    hospitalAffiliation: 'MediKiosk Apex Hospital — Heart & Vascular Center',
    bio: 'Senior Consultant Cardiologist specializing in preventive cardiology, coronary interventions, and hypertension management.',
  },
  {
    name: 'Dr. Anita Sharma',
    phone: '9876543202',
    password: 'Password@123',
    licenseNumber: 'MCI-MED-38291',
    specialization: 'General Medicine',
    experienceYears: 11,
    hospitalAffiliation: 'MediKiosk Apex Hospital — Internal Medicine OPD',
    bio: 'Lead Physician for acute adult triage, infectious illnesses, diabetes management, and chronic disease counseling.',
  },
  {
    name: 'Dr. Vikramaditya Rao',
    phone: '9876543203',
    password: 'Password@123',
    licenseNumber: 'MCI-NEURO-74910',
    specialization: 'Neurology',
    experienceYears: 16,
    hospitalAffiliation: 'MediKiosk Apex Neuro Sciences Institute',
    bio: 'Neurologist with clinical expertise in migraine management, peripheral neuropathies, epilepsy, and stroke rehabilitation.',
  },
  {
    name: 'Dr. Sunita Patel',
    phone: '9876543204',
    password: 'Password@123',
    licenseNumber: 'MCI-PULMO-92144',
    specialization: 'Pulmonology',
    experienceYears: 9,
    hospitalAffiliation: 'MediKiosk Apex Chest & Respiratory Wing',
    bio: 'Pulmonary specialist focused on bronchial asthma, chronic bronchitis, post-viral respiratory sequelae, and allergy care.',
  },
  {
    name: 'Dr. Ramesh Chandra',
    phone: '9876543205',
    password: 'Password@123',
    licenseNumber: 'MCI-ORTHO-18239',
    specialization: 'Orthopedics',
    experienceYears: 15,
    hospitalAffiliation: 'MediKiosk Ortho & Joint Reconstruction Clinic',
    bio: 'Orthopedic surgeon focusing on osteoarthritis, sports injuries, lumbar back pain, and joint preservation.',
  },
  {
    name: 'Dr. Meera Nambiar',
    phone: '9876543206',
    password: 'Password@123',
    licenseNumber: 'MCI-DERM-51928',
    specialization: 'Dermatology',
    experienceYears: 8,
    hospitalAffiliation: 'MediKiosk Apex Skin & Laser Institute',
    bio: 'Clinical dermatologist specializing in allergic dermatitis, chronic eczema, acne vulgaris, and pediatric skin conditions.',
  },
  {
    name: 'Dr. Arvind Swamy',
    phone: '9876543207',
    password: 'Password@123',
    licenseNumber: 'MCI-GASTRO-63102',
    specialization: 'Gastroenterology',
    experienceYears: 12,
    hospitalAffiliation: 'MediKiosk Digestive Health Center',
    bio: 'Gastroenterologist with deep clinical interest in acid peptic disorders, fatty liver disease, and functional bowel symptoms.',
  },
  {
    name: 'Dr. Priya Varma',
    phone: '9876543208',
    password: 'Password@123',
    licenseNumber: 'MCI-PEDIA-84192',
    specialization: 'Pediatrics',
    experienceYears: 10,
    hospitalAffiliation: 'MediKiosk Child Health & Immunization Wing',
    bio: 'Senior Pediatrician with dedicated care for infant nutrition, developmental milestones, pediatric fever, and childhood asthma.',
  },
];

// Sample Patients
const SAMPLE_PATIENTS = [
  {
    name: 'Ramesh Kumar',
    phone: '9876543210',
    password: 'Password@123',
    age: 38,
    gender: 'Male',
    bloodGroup: 'B+',
    weight: 74,
    height: 172,
    emergencyContact: '9876543299',
    preferredLanguage: 'en',
    aadhaarDemoVerified: true,
    aadhaarDemoId: 'DEMO-ABHA-8924',
  },
  {
    name: 'Sunita Devi',
    phone: '9876543211',
    password: 'Password@123',
    age: 46,
    gender: 'Female',
    bloodGroup: 'O+',
    weight: 62,
    height: 158,
    emergencyContact: '9876543298',
    preferredLanguage: 'hi',
    aadhaarDemoVerified: true,
    aadhaarDemoId: 'DEMO-ABHA-5112',
  },
  {
    name: 'Arjun Reddy',
    phone: '9876543212',
    password: 'Password@123',
    age: 29,
    gender: 'Male',
    bloodGroup: 'A+',
    weight: 80,
    height: 178,
    emergencyContact: '9876543297',
    preferredLanguage: 'te',
    aadhaarDemoVerified: false,
    aadhaarDemoId: '',
  },
];

const seedDatabase = async () => {
  console.log('[Seed] Checking database collections for pre-seeded SIH prototype data...');

  const medCount = await Medicine.countDocuments();
  if (medCount < 10000) {
    let medicinesToSeed = [];
    try {
      const dataPath = path.join(__dirname, '../data/medicines10000.json');
      if (fs.existsSync(dataPath)) {
        medicinesToSeed = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch (e) {
      console.warn('[Seed] Notice reading medicines10000.json:', e.message);
    }

    if (!medicinesToSeed || medicinesToSeed.length < 10000) {
      medicinesToSeed = SAMPLE_MEDICINES;
    }

    if (typeof Medicine.deleteMany === 'function') {
      await Medicine.deleteMany({});
    }

    console.log(`[Seed] Seeding ${medicinesToSeed.length} verified pharmaceutical medicines into formulary catalog...`);
    if (typeof Medicine.insertMany === 'function') {
      await Medicine.insertMany(medicinesToSeed);
    } else {
      for (const med of medicinesToSeed) {
        await Medicine.create(med);
      }
    }
    console.log(`[Seed] ✓ Seeded ${medicinesToSeed.length} medicines successfully into database.`);
  }

  // Purge any legacy demo doctor or patient accounts so user starts with a completely clean database
  const DEMO_PHONES = [
    '9876543201', '9876543202', '9876543203', '9876543204',
    '9876543205', '9876543206', '9876543207', '9876543208',
    '9876543210', '9876543211', '9876543212', '9876543299',
  ];

  try {
    for (const phone of DEMO_PHONES) {
      const user = await User.findOne({ phoneNumber: phone });
      if (user) {
        await User.deleteOne({ _id: user._id });
        await PatientProfile.deleteOne({ userId: user._id });
        await DoctorProfile.deleteOne({ userId: user._id });
        await MedicalTimeline.deleteMany({ patientId: user._id });
      }
    }
    console.log('[Seed] ✓ Clean state verified: Demo accounts purged. All user-created accounts & records will store permanently.');
  } catch (err) {
    console.warn('[Seed] Notice during demo accounts purge:', err.message);
  }

  console.log('[Seed] MediKiosk initialization complete.');
};

if (require.main === module) {
  const { connectDB } = require('../config/db');
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  connectDB().then(() => {
    seedDatabase().then(() => {
      process.exit(0);
    });
  });
}

module.exports = { seedDatabase, SAMPLE_MEDICINES, SAMPLE_DOCTORS, SAMPLE_PATIENTS };
