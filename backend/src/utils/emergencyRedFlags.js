/**
 * MediKiosk 14-Category Clinical Emergency Red-Flag Engine
 * Real-time detection of high-risk red-flag symptoms requiring urgent emergency triage.
 * Covers all 14 standard emergency categories with multilingual patterns (English, Hindi, Telugu, Tamil, Marathi, etc.)
 */

const EMERGENCY_RED_FLAG_CATEGORIES = [
  {
    id: 'chest_heart',
    emoji: '❤️',
    category: 'Chest / Heart',
    name: 'Chest / Heart Emergency',
    symptoms: 'Severe chest pain or pressure, especially with sweating, nausea, breathlessness, or pain spreading to arm/jaw/back',
    alert: 'Possible acute coronary syndrome / myocardial infarction. Requires immediate emergency medical intervention, ECG, and cardiovascular triage.',
    immediateAction: 'Sit comfortably and rest immediately. Loosen tight clothing. Call 112 / 108 or proceed to the nearest Emergency Department immediately. Do not drive yourself.',
    regex: /(chest\s*pain|heart\s*pain|pressure\s*in\s*chest|tightness\s*in\s*chest|chest\s*pressure|crushing\s*chest|squeezing\s*chest|heaviness\s*in\s*chest|pain\s*(?:spreading|radiating)\s*to\s*(?:left\s*)?(?:arm|jaw|back|neck|shoulder)|left\s*arm\s*pain|chest\s*pain.*sweating|chest\s*pain.*nausea|chest\s*pain.*breathless|angina|heart\s*attack|छाती\s*में\s*(?:दर्द|दबाव)|सीने\s*में\s*(?:दर्द|जलन|दबाव)|दिल\s*का\s*दौरा|గుండె\s*నొప్పి|ఛాతీ\s*నొప్పి|மார்பு\s*வலி|छातीत\s*दुखणे)/i,
  },
  {
    id: 'breathing',
    emoji: '🫁',
    category: 'Breathing',
    name: 'Severe Breathing Distress',
    symptoms: 'Severe difficulty breathing, inability to speak normally because of breathlessness, blue/grey lips or face',
    alert: 'Acute respiratory compromise or hypoxia. Requires immediate clinical airway assessment, supplemental oxygen, and urgent care.',
    immediateAction: 'Sit upright to ease lung expansion. Loosen any restrictive collar or clothing. Call 112 / 108 or alert hospital emergency nurses immediately.',
    regex: /(severe\s*diffic.*breath|cannot\s*breathe|can't\s*breathe|struggling\s*to\s*breathe|gasping\s*for\s*air|inability\s*to\s*speak.*breath|shortness\s*of\s*breath|dyspnea|gasping|choking|suffocating|blue\s*lips|grey\s*lips|blue\s*face|cyanosis|lips\s*turning\s*blue|severe\s*asthma\s*attack|stridor|wheezing.*cannot\s*talk|सांस\s*लेने\s*में\s*(?:बहुत\s*)?तकलीफ|सांस\s*फूल|सांस\s*नहीं\s*आ\s*रही|होठ\s*नीले|శ్వాస\s*(?:తీసుకోవడంలో\s*)?(?:తీవ్రమైన\s*)?ఇబ్బంది|మూச்சு\s*திணறல்|श्वास\s*घेण्यास\s*त्रास)/i,
  },
  {
    id: 'stroke_neuro',
    emoji: '🧠',
    category: 'Stroke / Neurological',
    name: 'Stroke / Focal Neurological Deficit',
    symptoms: 'Sudden weakness or numbness on one side, sudden difficulty speaking, sudden confusion, sudden vision loss, sudden severe dizziness',
    alert: 'Suspected acute ischemic or hemorrhagic stroke (FAST protocol). Time-critical emergency requiring urgent neuroimaging and stroke triage.',
    immediateAction: 'Check FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 112/108 immediately. Note the exact time symptoms started.',
    regex: /(sudden\s*weakness|numbness\s*on\s*one\s*side|weakness\s*on\s*one\s*side|one\s*side\s*weak|face\s*droop|facial\s*droop|sudden\s*diffic.*speak|slurred\s*speech|cannot\s*move\s*arm|cannot\s*move\s*leg|sudden\s*confusion|sudden\s*severe\s*dizziness|sudden\s*paralysis|hemiplegia|stroke|transient\s*ischemic|लकवा|पक्षाघात|एक\s*तरफ\s*कमजोरी|बोलने\s*में\s*दिक्कत|मुंह\s*टेढ़ा|పక్షవాతం|ఒకవైపు\s*బలహీనత|ஒரு\s*பக்கம்\s*பலவீனம்|तोंड\s*वाकडे)/i,
  },
  {
    id: 'severe_headache',
    emoji: '🧠',
    category: 'Severe Headache',
    name: 'Sudden Extremely Severe Headache',
    symptoms: 'Sudden extremely severe headache, especially if it is unusual or accompanied by neurological symptoms',
    alert: 'Possible subarachnoid hemorrhage, intracranial emergency, or acute neurological crisis requiring immediate CT brain evaluation.',
    immediateAction: 'Avoid sudden head movements. Lie still in a darkened, quiet area. Seek immediate emergency evaluation at a hospital with neuro-imaging.',
    regex: /(thunderclap\s*headache|worst\s*headache|sudden\s*extremely\s*severe\s*headache|sudden\s*severe\s*headache|severe\s*headache.*unusual|headache.*stiff\s*neck|headache.*confusion|unbearable\s*headache|explosive\s*headache|अचानक\s*बहुत\s*तेज\s*सिरदर्द|असहनीय\s*सिरदर्द|तीవ్రమైన\s*తలనొప్పి|கடுமையான\s*தலைவலி|अतिशय\s*तीव्र\s*डोकेदुखी)/i,
  },
  {
    id: 'severe_bleeding',
    emoji: '🩸',
    category: 'Severe Bleeding',
    name: 'Severe / Uncontrolled Bleeding',
    symptoms: 'Heavy bleeding that does not stop, vomiting blood, coughing significant amounts of blood, black/tarry stools',
    alert: 'Acute hemorrhagic emergency or severe gastrointestinal/pulmonary bleeding requiring rapid hemostasis and volume resuscitation.',
    immediateAction: 'Apply firm, continuous pressure with a clean cloth or bandage. Keep the injured area elevated if possible. Do not swallow blood. Call 112/108 immediately.',
    regex: /(heavy\s*bleeding|bleeding.*not\s*stop|uncontrolled\s*bleeding|profuse\s*bleeding|vomiting\s*blood|vomit.*blood|hematemesis|coughing\s*(?:up\s*)?blood|cough.*blood|hemoptysis|black\s*tarry\s*stools|black\s*stool|tarry\s*stool|melena|rectal\s*bleeding\s*heavy|खून\s*की\s*उल्टी|खून\s*बहना\s*बंद\s*नहीं|खांसी\s*में\s*खून|काला\s*मल|రక్తం\s*వాంతులు|తీవ్రమైన\s*రక్తస్రావం|இரத்த\s*வாந்தி|जास्त\s*रक्तस्त्राव)/i,
  },
  {
    id: 'loss_of_consciousness',
    emoji: '🧍',
    category: 'Loss of Consciousness',
    name: 'Loss of Consciousness / Syncope',
    symptoms: 'Fainting/unresponsiveness, inability to wake the person, sudden collapse',
    alert: 'Syncope, acute coma, or hemodynamic collapse requiring rapid airway, breathing, circulation (ABC) evaluation and ECG.',
    immediateAction: 'Place patient on their back and elevate legs slightly if breathing normally. Turn to recovery position (on their side) if vomiting. Do not give fluids.',
    regex: /(faint(?:ed|ing)?|passed\s*out|unconscious|unresponsive|unresponsiveness|inability\s*to\s*wake|cannot\s*wake|sudden\s*collapse|collapsed|blackout|syncope|lost\s*consciousness|loss\s*of\s*consciousness|comatose|बेहोश|बेहोशी|अचेत|उठ\s*नहीं\s*रहा|गिर\s*पड़ा|స్పృహ\s*తప్పడం|కళ్లు\s*తిరిగి\s*పడిపోవడం|மயக்கம்|बेशुद्ध)/i,
  },
  {
    id: 'seizure',
    emoji: '⚡',
    category: 'Seizure',
    name: 'Prolonged or Repeated Seizures',
    symptoms: 'A seizure lasting several minutes, repeated seizures, or a person who does not regain consciousness normally afterward',
    alert: 'Status epilepticus or acute repetitive seizures. Carries risk of brain injury or airway compromise. Immediate medical cessation required.',
    immediateAction: 'Do NOT restrain the person or put anything in their mouth. Clear hard or sharp objects away. Turn them gently onto one side. Call 112/108 immediately.',
    regex: /(seizure|convulsion|epileptic\s*fit|fits|seizures\s*lasting|repeated\s*seizures|not\s*regain\s*consciousness.*seizure|status\s*epilepticus|violent\s*shaking\s*uncontrollable|दौरा|मिर्गी|झटके\s*आना|ఫిట్స్|మూర్ఛ|வலிப்பு|आकडी|फेफरे)/i,
  },
  {
    id: 'major_injury',
    emoji: '🤕',
    category: 'Major Injury',
    name: 'Major Trauma / Head & Spinal Injury',
    symptoms: 'Serious head injury, severe trauma, suspected spinal injury, major burns',
    alert: 'Major polytrauma or neurotrauma. Critical risk of spinal cord damage, intracranial hemorrhage, or third-degree burn shock.',
    immediateAction: 'Do NOT move the person if spinal or neck injury is suspected unless in immediate physical danger. Cover burns with sterile/clean dry cloth. Call 112/108 immediately.',
    regex: /(serious\s*head\s*injury|head\s*trauma|severe\s*trauma|spinal\s*injury|spine\s*injury|broken\s*neck|neck\s*injury|major\s*burns|severe\s*burns|third\s*degree\s*burn|fall\s*from\s*height|high\s*speed\s*accident|compound\s*fracture|bone\s*poking\s*out|stab\s*wound|gunshot|सिर\s*में\s*गंभीर\s*चोट|रीढ़\s*की\s*हड्डी|गंभीर\s*जलन|गंभीर\s*दुर्घटना|తీవ్రమైన\s*గాయం|వెన్నెముక\s*గాయం|விபத்து\s*காயம்|तीव्र\s*जखम)/i,
  },
  {
    id: 'severe_abdominal_pain',
    emoji: '🩸',
    category: 'Severe Abdominal Pain',
    name: 'Acute Severe Abdominal Emergency',
    symptoms: 'Sudden or severe abdominal pain, particularly with fainting, persistent vomiting, or significant bleeding',
    alert: 'Possible acute surgical abdomen (perforation, appendicitis with rupture, internal hemorrhage, bowel obstruction, or aortic aneurysm).',
    immediateAction: 'Do not eat, drink, or take oral pain relievers until evaluated by a surgeon. Lie down in a comfortable position and seek immediate emergency assessment.',
    regex: /(sudden\s*severe\s*abdominal\s*pain|severe\s*abdominal\s*pain|severe\s*stomach\s*pain.*(?:vomit|faint|bleed)|intolerable\s*stomach\s*pain|acute\s*abdomen|rigid\s*abdomen|severe\s*belly\s*pain|unbearable\s*abdominal\s*pain|stomach\s*cramps.*collapse|पेट\s*में\s*(?:अचानक\s*)?(?:बहुत\s*तेज|असहनीय)\s*दर्द|पेट\s*दर्द.*उल्टी|కడుపులో\s*తీవ్రమైన\s*నొప్పి|వయిற்று\s*வலி|पोटात\s*तीव्र\s*कळा)/i,
  },
  {
    id: 'severe_infection',
    emoji: '🌡️',
    category: 'Severe Infection Signs',
    name: 'Severe Sepsis / Infection Crisis',
    symptoms: 'Severe illness with confusion, extreme weakness, difficulty breathing, or rapidly worsening condition',
    alert: 'Clinical suspicion of sepsis, septic shock, or acute systemic decompensation. Early intravenous antibiotics and fluid resuscitation are life-critical.',
    immediateAction: 'Record vital signs if available. Do not delay: seek immediate emergency department admission for blood cultures and IV therapy.',
    regex: /(sepsis|septic\s*shock|severe\s*infection|high\s*fever.*confusion|fever.*extreme\s*weakness|fever.*difficulty\s*breathing|illness.*confusion|rapidly\s*worsening\s*condition|fever.*stiff\s*neck|meningitis|shivering\s*violently.*fever|तेज\s*बुखार.*भ्रम|गंभीर\s*संक्रमण|तीవ్రమైన\s*ఇన్ఫెక్షన్|கடும்\s*தொற்று|तीव्र\s*संसर्ग)/i,
  },
  {
    id: 'poisoning_overdose',
    emoji: '💊',
    category: 'Poisoning / Overdose',
    name: 'Poisoning / Toxic Ingestion / Overdose',
    symptoms: 'Suspected poisoning, drug overdose, or serious medication reaction',
    alert: 'Acute toxicological emergency. Requires immediate identification of agent, airway protection, antidote administration, and poison center contact.',
    immediateAction: 'Do NOT induce vomiting unless instructed by a physician. Keep the container or package of the swallowed substance. Call 112 / 108 or National Poison Control immediately.',
    regex: /(suspected\s*poisoning|poisoning|poison|drug\s*overdose|overdose|swallowed\s*poison|drank\s*poison|consumed\s*pesticide|swallowed\s*chemical|serious\s*medication\s*reaction|took\s*too\s*many\s*pills|sleeping\s*pill\s*overdose|toxic\s*ingestion|insecticide\s*poisoning|ज़हर|विषाक्तता|दवा\s*का\s*ओवरडोज|कीटनाशक|విషం|మందుల\s*ఓవర్\s*డోస్|மருந்து\s*அளவுக்கதிகம்|विषबाधा)/i,
  },
  {
    id: 'pregnancy_emergency',
    emoji: '🤰',
    category: 'Pregnancy Emergency',
    name: 'Obstetric & Pregnancy Emergency',
    symptoms: 'Heavy bleeding, severe abdominal pain, seizures, loss of consciousness, or severe breathing difficulty during pregnancy',
    alert: 'Critical obstetric emergency (possible ectopic pregnancy rupture, placental abruption, severe pre-eclampsia / eclampsia, or hemorrhage).',
    immediateAction: 'Lie on your left side to maximize placental blood flow. Do NOT insert tampons or take pain medication. Call 112/108 or proceed immediately to Obstetric Emergency.',
    regex: /(pregnant.*heavy\s*bleeding|pregnancy.*bleeding|bleeding\s*during\s*pregnancy|heavy\s*bleeding.*pregnant|severe\s*abdominal\s*pain.*pregnant|seizures.*pregnant|loss\s*of\s*consciousness.*pregnant|severe\s*breathing\s*diffic.*pregnant|preeclampsia|eclampsia|ectopic\s*pregnancy|placental\s*abruption|water\s*broke.*bleeding|miscarriage.*heavy\s*bleeding|गर्भावस्था\s*में\s*रक्तस्राव|गर्भवती.*खून|గర్భధారణ.*రక్తస్రావం|గర్భధారణ\s*సమస్య|గర్భిణీ.*రక్తస్రావం|கர்ப்ப\s*கால\s*அவசரம்|गरोदरपणात\s*रक्तस्त्राव)/i,
  },
  {
    id: 'sudden_vision_problems',
    emoji: '👁️',
    category: 'Sudden Vision Problems',
    name: 'Acute Sudden Vision Loss',
    symptoms: 'Sudden loss of vision or major sudden change in vision',
    alert: 'Acute ophthalmic emergency (central retinal artery occlusion, acute angle-closure glaucoma, retinal detachment, or stroke). Window for saving sight is narrow.',
    immediateAction: 'Do not rub the eye. Rest in a comfortable position without putting pressure on the eye. Seek immediate emergency ophthalmology care.',
    regex: /(sudden\s*loss\s*of\s*vision|sudden\s*blindness|lost\s*vision\s*suddenly|sudden\s*major\s*change\s*in\s*vision|cannot\s*see\s*suddenly|went\s*blind\s*suddenly|curtain\s*over\s*eye|retinal\s*detachment|acute\s*glaucoma|sudden\s*double\s*vision|blind\s*in\s*one\s*eye|अचानक\s*(?:दिखाई\s*देना\s*बंद|अंधापन)|आंखों\s*के\s*आगे\s*अचानक\s*अंधेरा|హఠాత్తుగా\s*చూపు\s*కోల్పోవడం|திடீர்\s*பார்வை\s*இழப்பு|अचानक\s*दृष्टी\s*जाणे)/i,
  },
  {
    id: 'severe_allergic_reaction',
    emoji: '🦵',
    category: 'Severe Allergic Reaction',
    name: 'Severe Allergic Reaction / Anaphylaxis',
    symptoms: 'Difficulty breathing, swelling of the face/throat, or sudden severe allergic symptoms',
    alert: 'Anaphylactic medical emergency. Risk of rapid airway obstruction, cardiovascular collapse, and shock. Epinephrine injection required immediately.',
    immediateAction: 'If an Epinephrine auto-injector (EpiPen) is available, use it into outer thigh immediately. Sit up if breathing is difficult, or lie down if dizzy. Call 112/108 immediately.',
    regex: /(anaphylaxis|severe\s*allergic|swelling\s*of\s*(?:the\s*)?(?:face|throat|tongue|lips)|throat\s*closing|lips\s*swollen.*breath|severe\s*allergic\s*symptoms|allergic.*diffic.*breath|bee\s*sting.*severe|peanut\s*allergy.*throat|food\s*allergy.*breath|गले\s*में\s*सूजन|चेहरे\s*पर\s*सूजन|एलर्जी.*सांस\s*बंद|తీవ్రమైన\s*అలెర్జీ|ముఖం\s*వాపు|ஒவ்வாமை\s*வீக்கம்|चेहऱ्यावर\s*किंवा\s*घशात\s*सूज)/i,
  },
];

/**
 * Screen text against all 14 Emergency Red Flag Categories
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
  screenEmergencyRedFlags,
};
