/**
 * MediKiosk 14-Category High-Precision Emergency Red-Flag Engine
 * Calibrated specifically to trigger ONLY for genuine, life-threatening medical emergencies (ESI Level 1 & 2).
 * Routine/common conditions (acidity, GERD, common headaches, migraines, viral flu, food poisoning, mild breathlessness)
 * are strictly filtered out and handled via regular OPD case-taking.
 */

// Explicit suppression patterns for benign, routine, and common OPD presentations
const ROUTINE_NON_EMERGENCY_PATTERNS = [
  // Acidity, GERD, Heartburn, Gas, Indigestion
  /\b(?:acidity|acid\s*reflux|heartburn|gerd|gas\s*problem|chest\s*burning\s*after\s*food|burning\s*sensation\s*in\s*chest\s*after|gastric\s*trouble|bloating|flatulence)\b/i,
  /(?:सीने\s*में\s*जलन|छाती\s*में\s*जलन|पेट\s*में\s*गैस|खट्टी\s*डकार|छातीत\s*जळजळ|గుండెల్లో\s*మంట)/i,

  // Common headaches, migraines, tension, sinus headaches without neurological deficit
  /\b(?:migraine|sinus\s*headache|tension\s*headache|headache\s*from\s*(?:stress|computer|screen|lack\s*of\s*sleep|fatigue)|mild\s*headache|routine\s*headache|common\s*headache|headache\s*and\s*nausea)\b/i,
  /(?:आधा\s*सिरदर्द|माइग्रेन|तनाव\s*से\s*सिरदर्द|साधारण\s*सिरदर्द|తేలికపాటి\s*తలనొప్పి)/i,

  // Common cold, viral fever, flu, cough, runny nose, sore throat
  /\b(?:common\s*cold|runny\s*nose|stuffy\s*nose|sneezing|sore\s*throat|mild\s*fever|viral\s*fever|flu\s*symptoms|cough\s*and\s*cold|fever\s*and\s*cold|fever\s*and\s*chills|fever\s*with\s*weakness|seasonal\s*flu)\b/i,
  /(?:सर्दी\s*जुकाम|हल्का\s*बुखार|गले\s*में\s*खराश|साधारण\s*बुखार|फ्लू|జలుబు|తేలికపాటి\s*జ్వరం)/i,

  // Gastroenteritis, food poisoning, simple upset stomach, diarrhea
  /\b(?:food\s*poisoning|stomach\s*upset|indigestion|diarrhea|loose\s*motion|loose\s*stools|vomited\s*once|mild\s*stomach\s*ache|gas\s*pain|stomach\s*pain\s*after\s*(?:food|eating|spicy))\b/i,
  /(?:पेट\s*खराब|दस्त|उल्टी\s*दस्त|पेट\s*में\s*गैस\s*का\s*दर्द|కడుపు\s*ఉబ్బరం|విరేచనాలు)/i,

  // Mild breathlessness on exertion or mild chronic conditions
  /\b(?:mild\s*shortness\s*of\s*breath|shortness\s*of\s*breath\s*(?:when|while)\s*(?:walking|climbing\s*stairs|running)|breathless\s*after\s*stairs|mild\s*wheezing)\b/i,

  // Minor fatigue, superficial scrapes, routine checkups
  /\b(?:routine\s*checkup|regular\s*checkup|blood\s*sugar\s*check|bp\s*check|minor\s*cut|paper\s*cut|small\s*scratch|tired\s*after\s*work|feeling\s*exhausted|general\s*fatigue|back\s*ache\s*from\s*sitting)\b/i,
];

// Critical life-threatening override markers — if ANY of these are present, bypass routine suppression
const CRITICAL_LIFE_THREATENING_OVERRIDE = /(?:heart\s*attack|cardiac\s*arrest|myocardial\s*infarction|coronary|angina|stroke|hemiplegia|unconscious|comatose|cannot\s*breathe|can't\s*breathe|cyanosis|blue\s*lips|choking|asphyxia|spurting\s*blood|vomiting\s*blood|hematemesis|coughing\s*(?:up\s*)?blood|hemoptysis|gunshot|stab\s*wound|compound\s*fracture|status\s*epilepticus|pesticide|drank\s*acid|swallowed\s*bleach|drug\s*overdose|thunderclap\s*headache|anaphylaxis|airway\s*closing|eclampsia|dil\s*ka\s*daura|हार्ट\s*अटैक|दिल\s*का\s*दौरा|पक्षाघात|लकवा|बेहोश|अचेत|खून\s*की\s*उल्टी|कीटनाशक|ज़हर|गुండెపోటు|పక్షవాతం|విషం)/i;

const EMERGENCY_RED_FLAG_CATEGORIES = [
  {
    id: 'chest_heart',
    emoji: '❤️',
    category: 'Chest / Heart',
    name: 'Acute Coronary Syndrome / Heart Attack',
    symptoms: 'Severe crushing chest pain radiating to left arm/jaw/neck, accompanied by cold sweats, shortness of breath, or cardiac collapse',
    alert: 'Possible acute coronary syndrome / myocardial infarction. Requires immediate emergency medical intervention, ECG, and cardiovascular triage.',
    immediateAction: 'Sit comfortably and rest immediately. Loosen tight clothing. Call 112 / 108 or proceed to the nearest Emergency Department immediately. Do not drive yourself.',
    regex: /(?:heart\s*attack|cardiac\s*arrest|myocardial\s*infarction|coronary\s*syndrome|angina\s*pectoris|(?:crushing|squeezing|heavy|gripping|suffocating|intense)\s*(?:chest\s*pain|pain\s*in\s*chest|chest\s*pressure)|chest\s*pain.*(?:radiat|spread).*(?:left\s*arm|jaw|neck|shoulder|back)|chest\s*pain.*(?:cold\s*sweat|profuse\s*sweat|collapsed|unconscious|cannot\s*breathe)|हार्ट\s*अटैक|दिल\s*का\s*दौरा|सीने\s*में\s*(?:असहनीय|भयानक|तीव्र|कुचलने\s*जैसा)\s*दर्द|छाती\s*में\s*(?:तेज\s*)?दर्द.*(?:बाएं\s*हाथ|जबड़े|पसीना|बेहोश)|గుండెపోటు|హార్ట్\s*ఎటాక్|గుండెలో\s*(?:తీవ్రమైన|భరించలేని)\s*నొప్పి|ఛాతీ\s*నొప్పి.*(?:ఎడమ\s*చేయి|చెమటలు)|மாரடைப்பு|மார்பில்\s*(?:கடுமையான|தாங்க\s*முடியாத)\s*வலி|हृदयविकाराचा\s*झटका)/i,
  },
  {
    id: 'breathing',
    emoji: '🫁',
    category: 'Breathing',
    name: 'Severe Acute Respiratory Failure',
    symptoms: 'Severe acute inability to breathe, choking/asphyxiation, gasping for air, or blue lips/face (cyanosis)',
    alert: 'Acute respiratory compromise or severe hypoxia. Requires immediate clinical airway assessment, supplemental oxygen, and urgent care.',
    immediateAction: 'Sit upright to ease lung expansion. Loosen any restrictive collar or clothing. Call 112 / 108 or alert hospital emergency nurses immediately.',
    regex: /(?:cannot\s*breathe|can't\s*breathe|unable\s*to\s*breathe|gasping\s*for\s*air|suffocating|choking\s*and\s*cannot\s*breathe|cyanosis|blue\s*lips|lips\s*turning\s*blue|blue\s*face|severe\s*respiratory\s*failure|acute\s*respiratory\s*distress|respiratory\s*arrest|inability\s*to\s*speak.*breath|cannot\s*talk.*breath|सांस\s*(?:पूरी\s*तरह\s*)?बंद\s*हो\s*रही|सांस\s*बिल्कुल\s*नहीं\s*आ\s*रही|दम\s*घुट\s*रहा|होठ\s*नीले\s*पड़|सांस\s*के\s*कारण\s*बोल\s*नहीं\s*पा\s*रहे|ఊపిరి\s*ఆడటం\s*లేదు|ఊపిరి\s*ఆడక\s*ఉక్కిరిబిక్కిరి|పెదవులు\s*నీలంగా\s*మారడం|சுவாசம்\s*முற்றிலும்\s*நின்றுவிட்டது|மூச்சு\s*திணறி\s*பேச\s*முடியவில்லை|श्वास\s*पूर्णपणे\s*कोंडला)/i,
  },
  {
    id: 'stroke_neuro',
    emoji: '🧠',
    category: 'Stroke / Neurological',
    name: 'Acute Stroke / Focal Neurological Deficit (FAST)',
    symptoms: 'Sudden hemiplegia/weakness on one side of the body, facial droop, sudden loss of speech or slurred speech',
    alert: 'Suspected acute ischemic or hemorrhagic stroke (FAST protocol). Time-critical emergency requiring urgent neuroimaging and stroke triage.',
    immediateAction: 'Check FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 112/108 immediately. Note the exact time symptoms started.',
    regex: /(?:\bstroke\b|hemiplegia|transient\s*ischemic\s*attack|\bcva\b|sudden\s*paralysis|paralysis\s*of\s*(?:one|half)\s*side|face\s*droop(?:ing)?|facial\s*droop(?:ing)?|mouth\s*twisted\s*to\s*one\s*side|sudden\s*(?:inability\s*to\s*speak|loss\s*of\s*speech|slurred\s*speech.*weakness)|sudden\s*weakness\s*on\s*one\s*side|one\s*side\s*of\s*(?:body|face)\s*(?:paralyzed|numb|limp|cannot\s*move)|लकवा|पक्षाघात|फेशियल\s*ड्रूप|मुंह\s*टेढ़ा\s*हो\s*गया|शरीर\s*का\s*एक\s*हिस्सा\s*सुन्न\s*या\s*कमजोर|अचानक\s*आवाज\s*लड़खड़ा|अचानक\s*हाथ\s*पैर\s*काम\s*करना\s*बंद|పక్షవాతం|ముఖం\s*వంకరపోవడం|ఒకవైపు\s*శరీరం\s*పడిపోవడం|பக்கவாதம்|முகம்\s*ஒருபுறம்\s*கோணுதல்|अर्धांगवायू|तोंड\s*वाकडे\s*होणे)/i,
  },
  {
    id: 'severe_headache',
    emoji: '🧠',
    category: 'Severe Headache',
    name: 'Sudden Thunderclap / Subarachnoid Hemorrhage',
    symptoms: 'Sudden "thunderclap" headache reaching maximum intensity in seconds, or worst headache of life with stiff neck/confusion',
    alert: 'Possible subarachnoid hemorrhage, intracranial aneurysm rupture, or acute intracranial emergency requiring immediate CT brain evaluation.',
    immediateAction: 'Avoid sudden head movements. Lie still in a darkened, quiet area. Seek immediate emergency evaluation at a hospital with neuro-imaging.',
    regex: /(?:thunderclap\s*headache|worst\s*headache\s*of\s*(?:my\s*)?life|sudden\s*explosive\s*headache|headache\s*peaked\s*in\s*seconds|subarachnoid\s*hemorrhage|aneurysm\s*rupture|intracranial\s*hemorrhage|(?:severe|worst)\s*headache.*(?:stiff\s*neck|neck\s*rigidity|projectile\s*vomit|altered\s*mental|loss\s*of\s*consciousness)|जिंदगी\s*का\s*सबसे\s*भयानक\s*सिरदर्द|अचानक\s*विस्फोटक\s*सिरदर्द|सिरदर्द.*गर्दन\s*अकड़|दिमाग\s*की\s*नस\s*फटना|జీవితంలో\s*ఎప్పుడూ\s*లేని\s*తీవ్రమైన\s*తలనొప్పి|మెడ\s*బిగుసుకుపోవడం.*తలనొప్పి|மின்னல்\s*போன்ற\s*கடும்\s*தலைவலி|आयुष्यातील\s*सर्वात\s*भयानक\s*डोकेदुखी)/i,
  },
  {
    id: 'severe_bleeding',
    emoji: '🩸',
    category: 'Severe Bleeding',
    name: 'Massive / Uncontrolled Arterial Bleeding',
    symptoms: 'Massive uncontrolled bleeding, vomiting blood (hematemesis), coughing up frank blood (hemoptysis), or spurting arterial wound',
    alert: 'Acute hemorrhagic emergency or severe gastrointestinal/pulmonary bleeding requiring rapid hemostasis and volume resuscitation.',
    immediateAction: 'Apply firm, continuous pressure with a clean cloth or bandage. Keep the injured area elevated if possible. Do not swallow blood. Call 112/108 immediately.',
    regex: /(?:vomiting\s*(?:pools\s*of\s*)?blood|vomit.*(?:bright\s*red\s*blood|large\s*amounts\s*of\s*blood)|hematemesis|coughing\s*(?:up\s*)?(?:copious|large\s*amounts\s*of|cups\s*of)\s*blood|massive\s*hemoptysis|arterial\s*bleeding|spurting\s*blood|bleeding\s*will\s*not\s*stop\s*after\s*pressure|profuse\s*uncontrolled\s*bleeding|massive\s*rectal\s*bleeding.*(?:dizzy|faint|shock)|large\s*black\s*tarry\s*stools.*(?:weak|faint)|खून\s*की\s*उल्टी|बड़ी\s*मात्रा\s*में\s*खून\s*की\s*उल्टी|फव्वारे\s*की\s*तरह\s*खून|खून\s*का\s*बहाव\s*रुक\s*नहीं\s*रहा|खांसी\s*में\s*बहुत\s*ज्यादा\s*खून|రక్తం\s*వాంతులు\s*కావడం|రక్తం\s*ధారగా\s*కారడం|ఆగని\s*రక్తస్రావం|இரத்த\s*வாந்தி|இரத்தம்\s*நிற்காமல்\s*கொட்டுதல்|रक्ताची\s*उलटी|रक्तस्त्राव\s*थांबतच\s*नाही)/i,
  },
  {
    id: 'loss_of_consciousness',
    emoji: '🧍',
    category: 'Loss of Consciousness',
    name: 'Acute Coma / Unresponsiveness / Collapse',
    symptoms: 'Comatose state, complete unresponsiveness, inability to wake the patient, or sudden hemodynamic collapse',
    alert: 'Syncope, acute coma, or hemodynamic collapse requiring rapid airway, breathing, circulation (ABC) evaluation and ECG.',
    immediateAction: 'Place patient on their back and elevate legs slightly if breathing normally. Turn to recovery position (on their side) if vomiting. Do not give fluids.',
    regex: /(?:\bunconscious\b|\bunresponsive\b|\bcomatose\b|\bunarousable\b|cannot\s*wake\s*(?:him|her|them|patient|person)|unable\s*to\s*wake\s*up|sudden\s*collapse\s*and\s*unresponsive|collapsed\s*and\s*not\s*waking|lost\s*consciousness\s*and\s*not\s*waking|deep\s*coma|बेहोश\s*है\s*और\s*होश\s*नहीं\s*आ\s*रहा|पूरी\s*तरह\s*अचेत|उठ\s*नहीं\s*रहा|कोमा\s*में|अचानक\s*गिर\s*कर\s*बेहोश|స్పృహ\s*లేకుండా\s*పడిపోవడం|లేపినా\s*లెలవకపోవడం|కోమాలోకి\s*వెళ్ళడం|சுயநினைவு\s*இன்றி|எழுப்ப\s*முடியவில்லை|கோமா\s*நிலை|पूर्णपणे\s*बेशुद्ध|जागेच\s*होत\s*नाही)/i,
  },
  {
    id: 'seizure',
    emoji: '⚡',
    category: 'Seizure',
    name: 'Status Epilepticus / Continuous Convulsions',
    symptoms: 'Seizures lasting several minutes, repeated seizures without regaining consciousness, or status epilepticus',
    alert: 'Status epilepticus or acute repetitive seizures. Carries risk of brain injury or airway compromise. Immediate medical cessation required.',
    immediateAction: 'Do NOT restrain the person or put anything in their mouth. Clear hard or sharp objects away. Turn them gently onto one side. Call 112/108 immediately.',
    regex: /(?:status\s*epilepticus|active\s*seizure|continuous\s*seizures|seizure\s*lasting\s*(?:more\s*than|over|\d+)\s*minutes|repeated\s*seizures\s*without\s*waking|violent\s*tonic\s*clonic\s*convulsion|epileptic\s*convulsion\s*not\s*stopping|grand\s*mal\s*seizure|लगातार\s*दौरे\s*पड़\s*रहे|मिर्गी\s*का\s*दौरा\s*रुक\s*नहीं\s*रहा|झटके\s*आना\s*बंद\s*नहीं\s*हो\s*रहा|స్టేటస్\s*ఎపిలెప్టికస్|వరుసగా\s*ఫిట్స్\s*రావడం|మూర్ఛ\s*ఆగకపోవడం|தொடர்ச்சியான\s*வலிப்பு|வலிப்பு\s*நிற்காமல்\s*வருவது|सतत\s*फेफरे\s*येणे)/i,
  },
  {
    id: 'major_injury',
    emoji: '🤕',
    category: 'Major Injury',
    name: 'Major Poly-Trauma / Penetrating & Spinal Injury',
    symptoms: 'Gunshot wound, stab wound to vital organs, compound fracture (bone exposed), suspected spinal fracture, third-degree burns',
    alert: 'Major polytrauma or neurotrauma. Critical risk of spinal cord damage, intracranial hemorrhage, or third-degree burn shock.',
    immediateAction: 'Do NOT move the person if spinal or neck injury is suspected unless in immediate physical danger. Cover burns with sterile/clean dry cloth. Call 112/108 immediately.',
    regex: /(?:gunshot\s*wound|stab\s*wound\s*to\s*(?:chest|abdomen|neck|throat)|stabbed|compound\s*fracture|bone\s*(?:poking|piercing|protruding)\s*through\s*skin|suspected\s*broken\s*neck|spinal\s*cord\s*severed|broken\s*spine\s*with\s*paralysis|third\s*degree\s*burns|severe\s*extensive\s*burns|burns\s*over\s*(?:large|entire)\s*body|high\s*speed\s*(?:car|vehicle|motorcycle)\s*crash.*(?:severe|crush|trauma)|fall\s*from\s*(?:high\s*building|several\s*floors|roof)|गोली\s*लगी|चाकू\s*घोंपा|हड्डी\s*चमड़ी\s*से\s*बाहर\s*निकल|गर्दन\s*की\s*हड्डी\s*टूटना|गंभीर\s*रूप\s*से\s*जल\s*गया|भीषण\s*सड़क\s*हादसा|తుపాకీ\s*గాయం|కత్తిపోటు|ఎముక\s*బయటకు\s*రావడం|తీవ్రమైన\s*రోడ్డు\s*ప్రమాదం|துப்பாக்கி\s*சூடு|கத்திக்குத்து|எலும்பு\s*வெளியே\s*வருதல்|हाड\s*त्वचेबाहेर\s*आले)/i,
  },
  {
    id: 'severe_abdominal_pain',
    emoji: '🩸',
    category: 'Severe Abdominal Pain',
    name: 'Acute Surgical Abdomen / Peritonitis',
    symptoms: 'Rigid board-like abdomen, suspected ruptured organ/appendix, or severe abdominal agony accompanied by fainting or shock',
    alert: 'Possible acute surgical abdomen (perforation, appendicitis with rupture, internal hemorrhage, bowel obstruction, or aortic aneurysm).',
    immediateAction: 'Do not eat, drink, or take oral pain relievers until evaluated by a surgeon. Lie down in a comfortable position and seek immediate emergency assessment.',
    regex: /(?:acute\s*surgical\s*abdomen|rigid\s*board-?like\s*abdomen|peritonitis|ruptured\s*(?:appendix|ulcer|aneurysm|bowel|organ)|severe\s*abdominal\s*pain.*(?:collapse|shock|fainting|unbearable\s*agony|cannot\s*stand\s*up)|पेट\s*अत्यधिक\s*कड़ा\s*हो\s*गया|पेट\s*की\s*नस\s*फटना|असहनीय\s*पेट\s*दर्द.*(?:बेहोश|शॉक|तड़प\s*रहा)|కడుపు\s*రాయిలా\s*గట్టిపడటం|పేగులు\s*చిట్లడం|కడుపులో\s*భరించలేని\s*తీవ్ర\s*నొప్పితో\s*స్పృహ\s*తప్పడం|வயிறு\s*கல்\s*போல்\s*இறுகுதல்|குடல்\s*வெடிப்பு|पोट\s*दगडासारखे\s*ताठ\s*होणे)/i,
  },
  {
    id: 'severe_infection',
    emoji: '🌡️',
    category: 'Severe Infection Signs',
    name: 'Septic Shock / Bacterial Meningitis Crisis',
    symptoms: 'Septic shock (hypotension, clammy skin, confusion), or high fever with stiff neck and purpuric non-blanching rash',
    alert: 'Clinical suspicion of sepsis, septic shock, or acute systemic decompensation. Early intravenous antibiotics and fluid resuscitation are life-critical.',
    immediateAction: 'Record vital signs if available. Do not delay: seek immediate emergency department admission for blood cultures and IV therapy.',
    regex: /(?:\bseptic\s*shock\b|\bsevere\s*sepsis\b|fever.*(?:purpuric\s*rash|petechial\s*rash|non-?blanching\s*rash)|high\s*fever.*(?:stiff\s*neck|neck\s*rigidity).*(?:delirium|confusion|photophobia)|\bmeningococcal\s*meningitis\b|सेप्टिक\s*शॉक|तेज\s*बुखार.*गर्दन\s*में\s*अकड़न.*प्रलाप|तेज\s*बुखार\s*के\s*साथ\s*बेहोशी\s*या\s*भ्रम|సెప్టిక్\s*షాక్|మెనింజైటిస్|செப்டிக்\s*ஷாக்|मेंदूज्वर)/i,
  },
  {
    id: 'poisoning_overdose',
    emoji: '💊',
    category: 'Poisoning / Overdose',
    name: 'Toxic Chemical Ingestion / Drug Overdose',
    symptoms: 'Ingestion of pesticide, insecticide, rat poison, bleach, corrosive acid, or deliberate medication overdose',
    alert: 'Acute toxicological emergency. Requires immediate identification of agent, airway protection, antidote administration, and poison center contact.',
    immediateAction: 'Do NOT induce vomiting unless instructed by a physician. Keep the container or package of the swallowed substance. Call 112 / 108 or National Poison Control immediately.',
    regex: /(?:swallowed\s*pesticide|drank\s*pesticide|consumed\s*pesticide|insecticide\s*poisoning|rat\s*poison|organophosphate|drank\s*acid|swallowed\s*bleach|consumed\s*toxic\s*chemical|drug\s*overdose|took\s*sleeping\s*pills\s*overdose|overdosed\s*on\s*(?:pills|medication|tablets|drugs|sedatives|narcotics)|swallowed\s*(?:lethal\s*)?poison|ingested\s*(?:toxic\s*)?poison|कीटनाशक\s*पी\s*लिया|ज़हर\s*खा\s*लिया|चूहे\s*मारने\s*की\s*दवा|तेज़ाब\s*पी\s*लिया|नींद\s*की\s*गोलियों\s*का\s*ओवरडोज|పురుగుల\s*మందు\s*తాగడం|విషం\s*తాగడం|నిద్రమాత్రల\s*ఓవర్\s*డోస్|యాసిడ్\s*తాగడం|பூச்சிக்கொல்லி\s*மருந்து\s*குடித்தல்|விஷம்\s*குடித்தல்|कीटकनाशक\s*पिणे|विष\s*पिणे)/i,
  },
  {
    id: 'pregnancy_emergency',
    emoji: '🤰',
    category: 'Pregnancy Emergency',
    name: 'Critical Obstetric Emergency / Eclampsia',
    symptoms: 'Massive bleeding during pregnancy, eclamptic seizures, or suspected ruptured ectopic pregnancy with acute shock',
    alert: 'Critical obstetric emergency (possible ectopic pregnancy rupture, placental abruption, severe pre-eclampsia / eclampsia, or hemorrhage).',
    immediateAction: 'Lie on your left side to maximize placental blood flow. Do NOT insert tampons or take pain medication. Call 112/108 or proceed immediately to Obstetric Emergency.',
    regex: /(?:\beclampsia\b|preeclampsia\s*with\s*seizures|ruptured\s*ectopic|placental\s*abruption|(?:pregnant|pregnancy).*(?:profuse\s*bleeding|massive\s*bleeding|heavy\s*bleeding|hemorrhag|seizure|convulsion|collapsed|unconscious)|heavy\s*vaginal\s*bleeding\s*during\s*pregnancy|severe\s*pelvic\s*agony.*pregnant.*shock|गर्भावस्था\s*में\s*भारी\s*रक्तस्राव|गर्भवती.*दौरे|एक्लेम्पसिया|एक्टोपिक\s*प्रेग्नेंसी\s*फटना|గర్భధారణలో\s*విపరీతమైన\s*రక్తస్రావం|గర్భిణీకి\s*ఫిట్స్\s*రావడం|கர்ப்பகால\s*கடும்\s*இரத்தப்போக்கு|கர்ப்பிணிக்கு\s*வலிப்பு|गरोदरपणात\s*प्रचंड\s*రక్తस्त्राव)/i,
  },
  {
    id: 'sudden_vision_problems',
    emoji: '👁️',
    category: 'Sudden Vision Problems',
    name: 'Acute Sudden Blindness / Retinal Occlusion',
    symptoms: 'Sudden total blindness, sudden blackout in eye, or sudden dark curtain falling over vision',
    alert: 'Acute ophthalmic emergency (central retinal artery occlusion, acute angle-closure glaucoma, retinal detachment, or stroke). Window for saving sight is narrow.',
    immediateAction: 'Do not rub the eye. Rest in a comfortable position without putting pressure on the eye. Seek immediate emergency ophthalmology care.',
    regex: /(?:sudden\s*(?:total\s*)?blindness|went\s*blind\s*suddenly|sudden\s*complete\s*loss\s*of\s*vision|black\s*curtain\s*(?:fell\s*)?over\s*(?:my\s*)?eye|retinal\s*artery\s*occlusion|acute\s*angle\s*closure\s*glaucoma|sudden\s*total\s*darkness\s*in\s*(?:one|both)\s*eye|अचानक\s*पूरी\s*तरह\s*अंधापन|अचानक\s*आंखों\s*के\s*आगे\s*पूरा\s*अंधेरा\s*छा\s*गया|अचानक\s*दिखना\s*बिल्कुल\s*बंद|హఠాత్తుగా\s*చూపు\s*మొత్తం\s*పోవడం|అకస్మాత్తుగా\s*కళ్లు\s*కనిపించకపోవడం|திடீரென\s*பார்வை\s*முற்றிலும்\s*போய்விட்டது|अचानक\s*दृष्टी\s*पूर्णपणे\s*जाणे)/i,
  },
  {
    id: 'severe_allergic_reaction',
    emoji: '🦵',
    category: 'Severe Allergic Reaction',
    name: 'Anaphylactic Shock / Airway Angioedema',
    symptoms: 'Anaphylaxis, sudden airway closure, severe throat or tongue swelling preventing breathing after exposure to allergen',
    alert: 'Anaphylactic medical emergency. Risk of rapid airway obstruction, cardiovascular collapse, and shock. Epinephrine injection required immediately.',
    immediateAction: 'If an Epinephrine auto-injector (EpiPen) is available, use it into outer thigh immediately. Sit up if breathing is difficult, or lie down if dizzy. Call 112/108 immediately.',
    regex: /(?:\banaphylaxis\b|\banaphylactic\s*shock\b|throat\s*closing\s*up.*allergic|allergic.*throat\s*(?:closing|swelling)\s*and\s*cannot\s*breathe|massive\s*tongue\s*swelling.*suffocating|airway\s*closing.*allergy|epipen\s*needed|anaphylactic\s*reaction.*stridor|एनाफिलेक्सिस|एलर्जी\s*से\s*गला\s*घुट\s*रहा|एलर्जी\s*से\s*गला\s*बंद\s*हो\s*रहा\s*है\s*और\s*सांस\s*नहीं\s*आ\s*रही|जीभ\s*और\s*गले\s*में\s*भयानक\s*सूजन|అనాఫిలాక్సిస్|అలెర్జీతో\s*గొంతు\s*మూసుకుపోవడం|శ్వాస\s*ఆడకపోవడం.*అలెర్జీ|அனாபிலாக்ஸிஸ்|ஒவ்வாமையால்\s*தொண்டை\s*அடைப்பு|अ‍ॅनाफिलेक्सिस)/i,
  },
];

/**
 * Screen text against all 14 Emergency Red Flag Categories with high-precision filtering
 * @param {string} allText 
 * @returns {object} Standardized screening result
 */
const screenEmergencyRedFlags = (allText = '') => {
  if (!allText || typeof allText !== 'string') {
    return {
      isRedFlag: false,
      priority: 'NORMAL',
      matchedCategories: [],
      primaryCategory: null,
      alertMessage: '',
      hotlines: ['112', '108', '911'],
    };
  }

  const clean = allText.trim();
  if (!clean) {
    return {
      isRedFlag: false,
      priority: 'NORMAL',
      matchedCategories: [],
      primaryCategory: null,
      alertMessage: '',
      hotlines: ['112', '108', '911'],
    };
  }

  // Check if this input matches a common, benign, routine complaint
  const isRoutine = ROUTINE_NON_EMERGENCY_PATTERNS.some((pattern) => pattern.test(clean));
  const hasCriticalOverride = CRITICAL_LIFE_THREATENING_OVERRIDE.test(clean);

  // If it's a routine ailment and has no critical life-threatening override, suppress false alarm immediately
  if (isRoutine && !hasCriticalOverride) {
    return {
      isRedFlag: false,
      priority: 'NORMAL',
      matchedCategories: [],
      primaryCategory: null,
      alertMessage: '',
      hotlines: ['112', '108', '911'],
    };
  }

  const matched = [];

  for (const item of EMERGENCY_RED_FLAG_CATEGORIES) {
    if (item.regex.test(clean)) {
      matched.push({
        id: item.id,
        emoji: item.emoji,
        category: item.category,
        name: item.name,
        symptoms: item.symptoms,
        alert: item.alert,
        immediateAction: item.immediateAction,
      });
    }
  }

  const isRedFlag = matched.length > 0;
  const primaryCategory = isRedFlag ? matched[0] : null;

  let alertMessage = '';
  if (isRedFlag) {
    const names = matched.map((m) => `${m.emoji} ${m.category}`).join(', ');
    alertMessage = `🚨 RED FLAG EMERGENCY DETECTED: [${names}] - Immediate emergency medical evaluation required. Please notify triage nursing staff or call 112/108 immediately.`;
  }

  return {
    isRedFlag,
    priority: isRedFlag ? 'HIGH_PRIORITY' : 'NORMAL',
    flags: matched,
    matchedCategories: matched,
    primaryCategory,
    alertMessage,
    hotlines: ['112', '108', '911'],
  };
};

module.exports = {
  EMERGENCY_RED_FLAG_CATEGORIES,
  ROUTINE_NON_EMERGENCY_PATTERNS,
  CRITICAL_LIFE_THREATENING_OVERRIDE,
  screenEmergencyRedFlags,
};
