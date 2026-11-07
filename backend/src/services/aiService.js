/**
 * MediKiosk AI Service Abstraction
 * Handles adaptive medical interviews, rule-based red-flag screening,
 * structured clinical summarization, and specialty recommendations.
 * Features 20+ disease domains with targeted diagnostic questioning.
 */

// 14-Category Clinical Emergency Red-Flag symptom triggers
const { EMERGENCY_RED_FLAG_CATEGORIES, screenEmergencyRedFlags } = require('../utils/emergencyRedFlags');
const RED_FLAG_TRIGGERS = EMERGENCY_RED_FLAG_CATEGORIES;

// Multilingual opening greetings for all 50 Indian languages (+ English)
const GREETINGS = {
  en: 'Hello! I am MediKiosk, your Smart Hospital Assistant. Please describe what health problem or disease you are experiencing today.',
  hi: 'नमस्ते! मैं मेडिकियोस्क हूँ, आपका स्मार्ट हॉस्पिटल सहायक। कृपया मुझे बताएं कि आज आपको क्या स्वास्थ्य समस्या या बीमारी महसूस हो रही है?',
  bn: 'নমস্কার! আমি মেডিকিয়স্ক, আপনার স্মার্ট হাসপাতাল সহকারী। দয়া করে জানান আজ আপনি কোন স্বাস্থ্য সমস্যায় ভুগছেন।',
  mr: 'नमस्कार! मी मेडिकिओस्क, तुमचा स्मार्ट हॉस्पिटल सहाय्यक. कृपया मला सांगा की आज तुम्हाला काय त्रास किंवा आजार होत आहे?',
  te: 'నమస్కారం! నేను మెడికియోస్క్, మీ స్మార్ట్ హాస్పిటల్ అసిస్టెంట్. దయచేసి ఈ రోజు మీరు ఎదుర్కొంటున్న ఆరోగ్య సమస్య లేదా వ్యాధి ఏమిటో చెప్పండి.',
  ta: 'வணக்கம்! நான் மெடிகியோஸ்க், உங்கள் ஸ்மார்ட் மருத்துவமனை உதவியாளர். இன்று உங்களுக்கு என்ன உடல்நல பிரச்சனை உள்ளது என்று கூறுங்கள்.',
  gu: 'નમસ્તે! હું મેડિકિઓસ્ક છું, તમારો સ્માર્ટ હોસ્પિટલ સહાયક. કૃપા કરીને મને કહો કે આજે તમને શું સ્વાસ્થ્ય સમસ્યા છે?',
  ur: 'السلام علیکم! میں میڈی کیوسک ہوں، آپ کا اسمارٹ ہسپتال اسسٹنٹ۔ برائے مہربانی بتائیں کہ آج آپ کو کیا تکلیف یا بیماری ہے؟',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು ಮೆಡಿಕಿಯೋಸ್ಕ್, ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಆಸ್ಪತ್ರೆ ಸಹಾಯಕ. ದಯವಿಟ್ಟು ಇಂದು ನಿಮಗೆ ಯಾವ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಇದೆ ಎಂದು ತಿಳಿಸಿ.',
  or: 'ନମସ୍କାର! ମୁଁ ମେଡିକିଓସ୍କ, ଆପଣଙ୍କ ସ୍ମାର୍ଟ ହସ୍ପିଟାଲ୍ ସହାୟକ। ଆଜି ଆପଣଙ୍କୁ କେଉଁ ସ୍ୱାସ୍ଥ୍ୟ ସମସ୍ୟା ହେଉଛି ଦୟାକରି କୁହନ୍ତୁ।',
  ml: 'നമസ്കാരം! ഞാൻ മെഡികിയോസ്ക്, നിങ്ങളുടെ സ്മാർട്ട് ഹോസ്പിറ്റൽ അസിസ്റ്റന്റ്. ഇന്ന് നിങ്ങൾക്ക് എന്തൊക്കെ ആരോഗ്യപ്രശ്നങ്ങളാണ് ഉള്ളതെന്ന് ദയവായി പറയുക.',
  pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਮੈਡੀਕਿਓਸਕ ਹਾਂ, ਤੁਹਾਡਾ ਸਮਾਰਟ ਹਸਪਤਾਲ ਸਹਾਇਕ। ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਅੱਜ ਤੁਹਾਨੂੰ ਕੀ ਸਿਹਤ ਸਮੱਸਿਆ ਆ ਰਹੀ ਹੈ?',
  as: 'নমস্কাৰ! মই মেডিকিয়স্ক, আপোনাৰ স্মাৰ্ট চিকিৎসালয় সহায়ক। অনুগ্ৰহ কৰি কওক আজি আপোনাৰ কি স্বাস্থ্য সমস্যা হৈছে?',
  mai: 'प्रणाम! हम मेडिकियोस्क छी, अहाँक स्मार्ट अस्पताल सहायक। कृपया बताउ जे आई अहाँ के कोन बीमारी भऽ रहल अछि?',
  sat: 'ᱡᱚᱦᱟᱨ! ᱤᱧ ᱫᱚ ᱢᱮᱰᱤᱠᱤᱭᱳᱥᱠ, ᱟᱢᱟᱜ ᱥᱢᱟᱨᱴ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱜᱚᱲᱚ᱾ ᱫᱟᱭᱟᱠᱟᱛᱮ ᱞᱟᱹᱭᱢᱮ ᱛᱮᱦᱮᱧ ᱟᱢᱟᱜ ᱪᱮᱫ ᱦᱚᱲᱢᱚ ᱮᱴᱠᱮᱴᱮᱬᱮ ᱢᱮᱱᱟᱜᱼᱟ?',
  ks: 'سلام! بؤ چھُس میڈِکِیاسک، تُہُنٛد سمارٹ ہسپتال مَدَتگار۔ مِہربٲنی کٔرِتھ بَنٲوِو کِہ آز کیا صِحَت بؠمٲری چَھو؟',
  ne: 'नमस्ते! म मेडिकियोस्क हुँ, तपाईंको स्मार्ट अस्पताल सहायक। कृपया मलाई भन्नुहोस् आज तपाईंलाई के स्वास्थ्य समस्या भइरहेको छ?',
  gon: 'జోహార్ / జై సేవా! నన్నా మెడికియోస్క్, మీ స్మార్ట్ ఆసుపత్రి సహాయకుడు. రోగ బాతల్ ఆందు చెప్పండి.',
  sd: 'سلام! مان ميڊي ڪيوسڪ آهيان، اوهان جو سمارٽ اسپتال اسسٽنٽ. مهرباني ڪري ٻڌايو ته اڄ اوهان کي ڪهڙي تڪليف آهي؟',
  kok: 'नमस्कार! हांव मेडिकिओस्क, तुमचो स्मार्ट हॉस्पीटल मदतनीस. उपकार करून सांगात आयज तुमकां कसलो त्रास जाता?',
  doi: 'नमस्ते! मैं मेडिकियोस्क आं, तुंदा स्मार्ट अस्पताल मददगार। दस्सो आज तुसेंगी केह् तकलीफ ऐ?',
  mni: 'ꯈꯨꯔꯨꯝꯖꯔꯤ! ꯑꯩꯍꯥꯛ ꯃꯦꯗꯤꯀꯤꯑꯣꯁ꯭ꯛꯅꯤ, ꯅꯍꯥꯛꯀꯤ ꯁꯃꯥꯔꯠ ꯍꯣꯁꯄꯤꯇꯥꯜ ꯃꯇꯦꯡꯅꯤ꯫ ꯉꯁꯤ ꯀꯔꯤ ꯑꯅꯥꯕ ꯂꯩꯕꯒꯦ ꯍꯥꯌꯕꯤꯌꯨ꯫',
  dhn: 'राम राम! मी मेडिकिओस्क शे, तुमचा हुशार दवाखाना मदतनीस. सांगा आज तुमले काय त्रास व्हई रायना?',
  kru: 'जोहार! एन मेडिकियोस्क हिकेन, नींगहाय स्मार्ट अस्पताल मदतगार. आज नींग काया बेमारी लगदी?',
  kha: 'Khublei! Nga dei u MediKiosk, u nongiarap hospital jong phi. Sngewbha ïathuh aiu phi shitom mynta ka sngi.',
  brx: 'खुलुमबाय! आं मेडिकियोस्क, नोंथांनि स्मार्ट देहाफाहामसालि हेफाजाबगिरि। दिनै नोंथांनि मा देहायारि जेंना जादों अननानै खिन्था।',
  grt: 'Salam! Anga MediKiosk, nang·ni smart hospital dakchakgipa. Da·alo nang·na maikai saa ba duko ga·aka u·iatbo.',
  unr: 'जोहार! अञ मेडिकियोस्क, आमः स्मार्ट अस्पताल दपड़ोम. तीसीं आमः चिलिकन रुगी मेनाः?',
  hoc: 'जोहार! अञ मेडिकियोस्क, अमः स्मार्ट अस्पताल दपड़ोम. तीसीं चिनाः रुगी मेनाः काजीमे.',
  kxu: 'ଜୋହାର! ମୁଁ ମେଡିକିଓସ୍କ, ଆପଣଙ୍କ ସ୍ମାର୍ଟ ହସ୍ପିଟାଲ୍ ସହାୟକ। ଆଜି କଣ ଅସୁବିଧା ହେଉଛି କୁହନ୍ତୁ।',
  kfq: 'राम राम! मे मेडिकियोस्क, तुम्हारो स्मार्ट अस्पताल मदतगार. आज तुम्हे काई तकलीफ हे?',
  hlb: 'जोहार! मुईं मेडिकियोस्क आवंव, तुंचो स्मार्ट अस्पताल जोड़ीदार. आज का बीमारी होए हे मोके बतावा.',
  mrg: 'Oí! Ngo MediKiosk, nokke smart hospital gílík. Sílo no kápila kínâm dún lúliklang.',
  mjw: 'Kardom! Ne MediKiosk, nangli smart hospital kethu. Pini nangli kapisi thembar nangsot ta than non.',
  kff: 'జోహార్! నేను మెడికియోస్క్, మీ స్మార్ట్ ఆసుపత్రి సహాయకుడు. ఈ రోజు మీకు ఏ సమస్య ఉంది?',
  njo: 'Salang! Ni ya MediKiosk, ne smart hospital yaritsür. Tanü na shirang shiranga ali metetdakjang.',
  stv: 'Ashelo! I ye MediKiosk, o smart hospital kikimhi. Nguno no pülü no shileni kükolono pike.',
  njm: 'Kevi! A a MediKiosk, u smart hospital kethsa. Thaie no kikra thsu ketho ba pujiulie.',
  nbe: 'Kapei! I MediKiosk, nang smart hospital meiyang. Tane nang hekamei ka mekam pa.',
  nmf: 'Khangashei! I MediKiosk, na smart hospital kashung. Aja na kathi kazat leikho hangmiro.',
  lus: 'Chibai! MediKiosk ka ni a, i smart damdawi in ṭanpuitu. Vawiinah eng hriselna harsatna nge i tawh min hrilh rawh le.',
  tcz: 'Chibai! Keima MediKiosk kahi e. Tuni hin dammona ima na nei em eihin hil in.',
  njh: 'Khumshung! A nte MediKiosk, nang smart hospital loroe. Nchungi no mhachakhe tssoka thowu.',
  rah: 'Namaskar! Anga MediKiosk, nangni smart hospital dakchakgiba. Tani nangni bemar katha sakhatha.',
  nri: 'Kevi! A a MediKiosk, u smart hospital kethsa. Thie no kekhre thsu batuo.',
  nph: 'Kahuk! I MediKiosk, nang smart hospital chang. Tane nang kanyei le meyang pa.',
  njz: 'Hokhe! Ngo MediKiosk, nokke smart hospital meba. Sii loda no hekhe bam kema.',
  lep: 'Khamri! Káyu MediKiosk, káyu smart hospital tsutbo. Thon zóng aatshang thóng bo.',
  lif: 'Sevak! Nga MediKiosk, khoniing smart hospital kembey. Aaniing meengba cikhim khekpa.',
  bix: 'जोहार! अञ मेडिकियोस्क, अमः स्मार्ट अस्पताल दपड़ोम. तीसीं चिनाः बेमारी मेनाः?',
  sa: 'नमस्ते! अहं मेडिकियोस्कः, भवतः चतुर-चिकित्सालय-सहायकः। अद्य भवान् कां स्वास्थ्यसमस्यां वा रोगम् अनुभवति कृपया वदतु।',
};

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
  te: 'Telugu (తెలుగు)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાતી)',
  ur: 'Urdu (اردو)',
  kn: 'Kannada (ಕನ್ನಡ)',
  or: 'Odia (ଓଡ଼ିଆ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  as: 'Assamese (অসমীয়া)',
  mai: 'Maithili (मैथिली)',
  sat: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)',
  ks: 'Kashmiri (कॉशुर)',
  ne: 'Nepali (नेपाली)',
  gon: 'Gondi (గోండీ)',
  sd: 'Sindhi (سنڌي)',
  kok: 'Konkani (कोंकणी)',
  doi: 'Dogri (डोगरी)',
  mni: 'Manipuri (ꯃꯤꯇꯩꯂꯣꯟ)',
  dhn: 'Khandeshi (खानदेशी)',
  kru: 'Kurukh (कुड़ुख़)',
  kha: 'Khasi',
  brx: 'Bodo (बड़ो)',
  grt: 'Garo',
  unr: 'Mundari (मुण्डारी)',
  hoc: 'Ho (हो)',
  kxu: 'Kui (କୁଇ)',
  kfq: 'Korku (कोरकू)',
  hlb: 'Halbi (हलबी)',
  mrg: 'Miri (Mising)',
  mjw: 'Karbi',
  kff: 'Koya (కోయ)',
  njo: 'Ao',
  stv: 'Sema',
  njm: 'Angami',
  nbe: 'Konyak',
  nmf: 'Tangkhul',
  lus: 'Mizo',
  tcz: 'Thado',
  njh: 'Lotha',
  rah: 'Rabha',
  nri: 'Chokri',
  nph: 'Phom',
  njz: 'Nyishi',
  lep: 'Lepcha',
  lif: 'Limbu',
  bix: 'Bhumij',
  sa: 'Sanskrit (संस्कृतम्)',
};

// Disease classification profiles with targeted multi-turn questions
const DISEASE_PROFILES = {
  fever: {
    id: 'fever',
    name: 'Fever / Systemic Infection',
    specialty: 'General Medicine',
    regex: /(fever|temperature|typhoid|dengue|malaria|chills|shivering|बुखार|ताप|జ్వరం)/i,
    questions: {
      en: [
        'How many days have you had this fever, does it spike at a particular time (morning/evening), and is it accompanied by chills or shivering?',
        'Have you noticed any associated signs like severe body ache, pain behind the eyes, skin rash, nausea, or vomiting?',
        'On a scale of 1 to 10 (1 mild, 10 severe), how intense is your weakness or headache right now?',
        'Do you have any past history of malaria, dengue, typhoid, or recent travel to endemic areas?',
        'Have you taken any fever medicines like Paracetamol, and do you have any known allergies to antibiotics or painkillers?',
      ],
      hi: [
        'यह बुखार कितने दिनों से है, क्या यह किसी खास समय (सुबह/शाम) ज्यादा बढ़ता है, और क्या आपको ठंड या कंपकंपी लग रही है?',
        'क्या बुखार के साथ बदन दर्द, आंखों के पीछे दर्द, शरीर पर दाने या उल्टी का मन हो रहा है?',
        '1 से 10 के पैमाने पर (1 हल्का, 10 बहुत तेज), इस समय आपकी कमजोरी या सिरदर्द कितना गंभीर है?',
        'क्या आपको पहले कभी मलेरिया, डेंगू या टाइफाइड हुआ है, या हाल ही में कहीं बाहर की यात्रा की है?',
        'क्या आपने पैरासिटामोल जैसी कोई दवा ली है, और क्या आपको किसी दवा से कोई एलर्जी है?',
      ],
      te: [
        'ఈ జ్వరం ఎన్ని రోజులుగా ఉంది, ఏదైనా నిర్దిష్ట సమయంలో (ఉదయం/సాయంత్రం) పెరుగుతుందా, మరియు చలి లేదా వణుకు ఉందా?',
        'జ్వరంతో పాటు తీవ్రమైన ఒళ్ళు నొప్పులు, కళ్ళ వెనుక నొప్పి, దద్దుర్లు లేదా వాంతులు ఏమైనా ఉన్నాయా?',
        '1 నుండి 10 స్కేలులో (1 స్వల్పం, 10 తీవ్రం), ప్రస్తుతం మీ నీరసం లేదా తలనొప్పి ఎంత తీవ్రంగా ఉంది?',
        'గతంలో మీకు మలేరియా, డెంగ్యూ లేదా టైఫాయిడ్ వచ్చిన చరిత్ర ఉందా?',
        'మీరు పారాసెటమాల్ వంటి మందులు ఏమైనా వాడారా, మరియు మందులతో ఏదైనా అలెర్జీ ఉందా?',
      ],
    },
  },
  cardiac: {
    id: 'cardiac',
    name: 'Cardiovascular / Chest Discomfort / BP',
    specialty: 'Cardiology',
    regex: /(chest\s*pain|heart|angina|palpitation|pressure\s*in\s*chest|tightness\s*in\s*chest|high\s*bp|hypertension|blood\s*pressure|छाती\s*में\s*दर्द|दिल|గుండె|ఛాతీ)/i,
    questions: {
      en: [
        'Could you describe the chest discomfort (pressure, squeezing, heaviness, or sharp pain), and does it radiate to your left arm, shoulder, neck, or jaw?',
        'Does the discomfort get worse when walking or climbing stairs, and are you feeling shortness of breath, dizziness, or cold sweating?',
        'On a scale of 1 to 10, how intense is the chest discomfort or pressure right now?',
        'Do you or your close family have a history of high blood pressure, cholesterol, heart disease, or diabetes?',
        'Are you currently taking any BP or heart medications (like Amlodipine, Telmisartan, Aspirin), and do you have any drug allergies?',
      ],
      hi: [
        'छाती में दर्द या भारीपन किस तरह का है (दबाव, जलन, या तेज दर्द), और क्या यह दर्द बाएं हाथ, कंधे, गर्दन या जबड़े की तरफ जाता है?',
        'क्या चलने या सीढ़ियां चढ़ने पर यह दर्द बढ़ता है, और क्या सांस फूलना, चक्कर आना या ठंडा पसीना आ रहा है?',
        '1 से 10 के पैमाने पर, इस समय छाती का दर्द या भारीपन कितना तेज है?',
        'क्या आपको या आपके परिवार में हाई बीपी, कोलेस्ट्रॉल, दिल की बीमारी या शुगर का इतिहास है?',
        'क्या आप वर्तमान में बीपी या दिल की कोई दवा ले रहे हैं, और क्या आपको किसी दवा से एलर्जी है?',
      ],
      te: [
        'ఛాతీలో అసౌకర్యం ఎలా ఉంది (ఒత్తిడి, బరువు లేదా తీవ్రమైన నొప్పి), మరియు ఇది ఎడమ చేయి, మెడ లేదా దవడ వైపు వ్యాపిస్తుందా?',
        'నడవడం లేదా మెట్లు ఎక్కేటప్పుడు నొప్పి పెరుగుతుందా, మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా చెమటలు పడుతున్నాయా?',
        '1 నుండి 10 స్కేలులో ప్రస్తుతం ఛాతీ నొప్పి తీవ్రత ఎంత ఉంది?',
        'మీకు లేదా కుటుంబ సభ్యులకు హై బీపీ, గుండె సమస్యలు లేదా మధుమేహం ఉన్నాయా?',
        'మీరు ప్రస్తుతం ఏదైనా బీపీ లేదా గుండె మందులు వాడుతున్నారా, మరియు ఏదైనా మందుల అలెర్జీ ఉందా?',
      ],
    },
  },
  respiratory: {
    id: 'respiratory',
    name: 'Respiratory / Asthma / Cough',
    specialty: 'Pulmonology',
    regex: /(cough|asthma|wheez|breathless|shortness\s*of\s*breath|phlegm|sputum|bronchitis|lungs|खांसी|दमा|దగ్గు|ఆయాసం)/i,
    questions: {
      en: [
        'Is the cough dry or producing phlegm/mucus, and does breathing difficulty get worse during the night or early morning?',
        'Have you noticed any whistling/wheezing sounds, chest tightness, or triggers like dust, cold weather, or pollution?',
        'On a scale of 1 to 10, how much is this cough or breathlessness interfering with your speech, sleep, or daily routine?',
        'Do you have a personal or family history of asthma, chronic bronchitis, allergies, or tobacco smoking?',
        'Are you currently using any inhalers (like Budesonide/Salbutamol), syrups, or allergy medicines, and do you have any drug allergies?',
      ],
      hi: [
        'क्या खांसी सूखी है या बलगम आ रहा है, और क्या रात में या सुबह के समय सांस लेने में ज्यादा परेशानी होती है?',
        'क्या सांस लेते समय सीटी जैसी आवाज (wheezing), छाती में जकड़न, या धूल-धुएं से परेशानी बढ़ती है?',
        '1 से 10 के पैमाने पर, यह खांसी या सांस फूलना आपकी बातचीत या नींद को कितना प्रभावित कर रहा है?',
        'क्या आपको पहले से दमा (अस्थमा), एलर्जी या धूम्रपान की आदत है?',
        'क्या आप कोई इनहेलर, कफ सिरप या एलर्जी की दवा ले रहे हैं, और क्या किसी दवा से एलर्जी है?',
      ],
      te: [
        'దగ్గు పొడిగా ఉందా లేదా కఫం వస్తుందా, మరియు రాత్రి లేదా ఉదయం పూట శ్వాస తీసుకోవడంలో ఇబ్బంది పెరుగుతుందా?',
        'శ్వాస పీల్చేటప్పుడు పిల్లికూతలు (wheezing) వినిపిస్తున్నాయా, మరియు దుమ్ము లేదా చలి వల్ల సమస్య ఎక్కువవుతుందా?',
        '1 నుండి 10 స్కేలులో, ఈ దగ్గు లేదా ఆయాసం మీ నిద్రను మరియు పనులను ఎంతవరకు ప్రభావితం చేస్తోంది?',
        'మీకు గతంలో ఆస్తమా, అలర్జీలు ఉన్నాయా లేదా ధూమపానం చేసే అలవాటు ఉందా?',
        'మీరు ఏదైనా ఇన్హేలర్లు లేదా దగ్గు మందులు వాడుతున్నారా, మరియు ఏదైనా అలర్జీ ఉందా?',
      ],
    },
  },
  gastrointestinal: {
    id: 'gastrointestinal',
    name: 'Gastrointestinal / Stomach Pain / Acidity',
    specialty: 'Gastroenterology',
    regex: /(stomach\s*pain|abdominal|abdomen|acidity|gerd|vomit|diarrhea|loose\s*motion|food\s*poisoning|nausea|gastric|constipation|पेट\s*दर्द|उल्टी|दस्त|కడుపు\s*నొప్పి|విరేచనాలు)/i,
    questions: {
      en: [
        'Where in your abdomen is the pain located (upper stomach, lower right, around navel), and does it feel like burning, cramping, or sharp stabbing?',
        'Have you had any vomiting, diarrhea, acid reflux, or noticed any blood in your vomit or stool?',
        'On a scale of 1 to 10, how severe is the stomach pain, and does eating food make it better or worse?',
        'Do you have a previous history of gastritis, stomach ulcers, gallstones, liver conditions, or jaundice?',
        'Have you taken any antacids (like Pantoprazole, Gelusil) or pain relief medicines, and do you have any medication allergies?',
      ],
      hi: [
        'पेट में दर्द किस जगह पर है (ऊपरी पेट, नाभि के पास, या नीचे दाईं तरफ), और क्या यह जलन, मरोड़ या तेज चुभन जैसा है?',
        'क्या उल्टी, दस्त, खट्टी डकारें आ रही हैं, या उल्टी/शौच में खून का कोई लक्षण दिखा है?',
        '1 से 10 के पैमाने पर, पेट का दर्द कितना तेज है, और क्या खाना खाने से यह बढ़ता या घटता है?',
        'क्या आपको पहले कभी गैस, पेट में अल्सर, पथरी या पीलिया (जॉन्डिस) की समस्या रही है?',
        'क्या आपने गैस या दर्द की कोई दवा ली है, और क्या आपको किसी दवा से एलर्जी है?',
      ],
      te: [
        'కడుపులో నొప్పి ఎక్కడ ఉంది (పై భాగం, బొడ్డు చుట్టూ లేదా క్రింది భాగం), మరియు ఇది మంటగా ఉందా లేదా పిసికినట్లు ఉందా?',
        'వాంతులు, విరేచనాలు లేదా వికారంగా ఉందా, మరియు మలంలో రక్తం పడటం వంటివి ఏమైనా గమనించారా?',
        '1 నుండి 10 స్కేలులో కడుపు నొప్పి తీవ్రత ఎంత ఉంది, మరియు ఆహారం తిన్న తర్వాత నొప్పి పెరుగుతుందా లేదా తగ్గుతుందా?',
        'గతంలో మీకు గ్యాస్టిక్, అల్సర్, పిత్తాశయంలో రాళ్ళు లేదా కామెర్ల చరిత్ర ఉందా?',
        'మీరు ఏదైనా గ్యాస్ లేదా నొప్పి నివారణ మందులు వాడారా, మరియు ఏదైనా మందుల అలర్జీ ఉందా?',
      ],
    },
  },
  diabetes: {
    id: 'diabetes',
    name: 'Diabetes / Blood Sugar Fluctuations',
    specialty: 'General Medicine',
    regex: /(diabetes|sugar|glucose|fbs|ppbs|hba1c|frequent\s*urination|excessive\s*thirst|मधुमेह|शुगर|షుగర్)/i,
    questions: {
      en: [
        'What was your most recent blood glucose (sugar) or HbA1c reading, and approximately how long have you been diagnosed or noticing fluctuations?',
        'Have you been experiencing increased thirst, frequent urination (especially at night), blurred vision, or numbness/tingling in your feet?',
        'On a scale of 1 to 10, how much fatigue, tiredness, or weakness have you been feeling during the day?',
        'Do you have any existing chronic conditions like high blood pressure, cholesterol, kidney changes, or non-healing cuts/sores?',
        'Are you currently taking insulin injections or oral tablets (such as Metformin, Glimepiride), and have you ever had low blood sugar (shakiness/sweating) episodes?',
      ],
      hi: [
        'हाल ही में आपका ब्लड शुगर या HbA1c कितना आया था, और कितने समय से यह समस्या या शुगर की बीमारी चल रही है?',
        'क्या आपको बहुत ज्यादा प्यास लगना, रात में बार-बार पेशाब आना, धुंधला दिखना, या पैरों में झनझनाहट/सुन्नपन महसूस हो रहा है?',
        '1 से 10 के पैमाने पर, दिनभर में आपको थकान या कमजोरी कितनी ज्यादा महसूस होती है?',
        'क्या आपको हाई बीपी, कोलेस्ट्रॉल, किडनी की समस्या या घाव देर से भरने जैसी कोई परेशानी है?',
        'क्या आप वर्तमान में इंसुलिन या शुगर की कोई गोली (जैसे मेटफॉर्मिन) ले रहे हैं, और क्या कभी शुगर बहुत कम (हाइपोग्लाइसीमिया) हुई है?',
      ],
      te: [
        'ఇటీవల మీ బ్లడ్ షుగర్ లేదా HbA1c రీడింగ్ ఎంత వచ్చింది, మరియు ఎన్ని రోజులుగా ఈ షుగర్ సమస్య ఉంది?',
        'అధిక దాహం, రాత్రిపూట తరచుగా మూత్రవిసర్జన, చూపు మందగించడం లేదా కాళ్ళలో తిమ్మిర్లు ఉన్నాయా?',
        '1 నుండి 10 స్కేలులో, రోజంతా మీకు ఎంతవరకు నీరసం లేదా అలసట అనిపిస్తోంది?',
        'మీకు హై బీపీ, కొలెస్ట్రాల్ లేదా గాయాలు త్వరగా మానకపోవడం వంటి సమస్యలు ఉన్నాయా?',
        'మీరు ఇన్సులిన్ లేదా మెట్‌ఫార్మిన్ వంటి మాత్రలు వాడుతున్నారా, మరియు ఎప్పుడైనా షుగర్ పడిపోయినట్లు అయిందా?',
      ],
    },
  },
  neurology: {
    id: 'neurology',
    name: 'Neurological / Headache / Migraine / Dizziness',
    specialty: 'Neurology',
    regex: /(headache|migraine|dizzy|vertigo|seizure|fits|numbness|tingling|सिरदर्द|चक्कर|తలనొప్పి|తలతిరగడం)/i,
    questions: {
      en: [
        'Is the headache throbbing, on one side, or all over, and does it come with nausea, vomiting, or visual disturbances (aura)?',
        'Are you sensitive to light or loud sound, and have you experienced any dizziness, spinning sensation, or numbness in your arms or face?',
        'On a scale of 1 to 10, how intense is the pain or dizziness right now, and does sleep or lying down help relieve it?',
        'How often do you experience these episodes (days per week/month), and do you have a family history of migraines or neurological conditions?',
        'What pain relievers or medications have you taken for this, and do you have any drug allergies?',
      ],
      hi: [
        'सिरदर्द किस तरह का है (एक तरफ, टीस मारने वाला या पूरे सिर में), और क्या इसके साथ उल्टी का मन या आंखों के आगे अंधेरा आता है?',
        'क्या तेज रोशनी या आवाज से परेशानी बढ़ती है, और क्या आपको चक्कर, कमजोरी या चेहरे/हाथों में सुन्नपन महसूस हुआ है?',
        '1 से 10 के पैमाने पर, सिरदर्द या चक्कर का दर्द कितना तीव्र है?',
        'ये सिरदर्द कितनी बार होता है (महीने या हफ्ते में कितने दिन), और क्या परिवार में किसी को माइग्रेन रहा है?',
        'सिरदर्द के लिए आपने कौन सी दवा ली है, और क्या किसी दवा से कोई एलर्जी है?',
      ],
      te: [
        'తలనొప్పి ఎలా ఉంది (ఒకవైపు మాత్రమేనా, గుచ్చుతున్నట్లు ఉందా లేదా మొత్తం తలనా), మరియు వాంతులు లేదా కళ్ళు తిరగడం ఉందా?',
        'వెలుతురు లేదా శబ్దాల వల్ల నొప్పి ఎక్కువవుతుందా, మరియు చేతులు లేదా ముఖంలో తిమ్మిర్లు వచ్చాయా?',
        '1 నుండి 10 స్కేలులో తలనొప్పి లేదా మైకం తీవ్రత ఎంత ఉంది?',
        'ఈ తలనొప్పి ఎంత తరచుగా వస్తుంది, మరియు కుటుంబంలో ఎవరికైనా మైగ్రేన్ సమస్య ఉందా?',
        'ఈ నొప్పికి మీరు ఏవైనా మందులు వాడారా, మరియు ఏదైనా మందుల అలెర్జీ ఉందా?',
      ],
    },
  },
  orthopedic: {
    id: 'orthopedic',
    name: 'Orthopedic / Joint Pain / Back Pain',
    specialty: 'Orthopedics',
    regex: /(joint|knee|back\s*pain|spine|arthritis|shoulder|hip|fracture|sprain|neck\s*pain|जोड़ों\s*का\s*दर्द|कमर\s*दर्द|కీళ్ల\s*నొప్పులు|వెన్నునొప్పి)/i,
    questions: {
      en: [
        'Which specific joint or area of your back hurts most, and is there visible swelling, redness, or morning stiffness?',
        'Does the pain shoot down into your legs or arms, and did it start suddenly after an injury/lifting or develop gradually over months?',
        'On a scale of 1 to 10, how much is this pain limiting your ability to walk, stand, climb stairs, or bend?',
        'Do you have a medical history of arthritis, high uric acid (gout), osteoporosis, or past spine/bone injuries?',
        'Have you taken any pain relievers (like Ibuprofen/Aceclofenac) or calcium supplements, and do you have any allergies to medications?',
      ],
      hi: [
        'शरीर के किस जोड़ या कमर के किस हिस्से में सबसे ज्यादा दर्द है, और क्या वहां सूजन, लालिमा या सुबह उठने पर जकड़न होती है?',
        'क्या यह दर्द पैर या हाथ की तरफ नीचे जाता है, और क्या यह किसी चोट या भारी वजन उठाने के बाद शुरू हुआ?',
        '1 से 10 के पैमाने पर, यह दर्द आपके चलने-फिरने या उठने-बैठने को कितना मुश्किल बना रहा है?',
        'क्या आपको पहले से गठिया (आर्थराइटिस), यूरिक एसिड या रीढ़ की हड्डी की कोई समस्या है?',
        'क्या आपने दर्द की कोई गोली या कैल्शियम की दवा ली है, और क्या किसी दवा से एलर्जी है?',
      ],
      te: [
        'ఏ కీలు లేదా వెన్నుభాగంలో ఎక్కువ నొప్పి ఉంది, మరియు వాపు లేదా ఉదయం లేవగానే బిగుతుగా ఉండటం ఉందా?',
        'నొప్పి కాళ్ళు లేదా చేతుల వైపు లాగుతున్నట్లు ఉందా, మరియు ఏదైనా దెబ్బ తగలడం లేదా బరువు ఎత్తడం వల్ల ప్రారంభమైందా?',
        '1 నుండి 10 స్కేలులో, ఈ నొప్పి మీ నడకను లేదా కూర్చోవడాన్ని ఎంతవరకు కష్టతరం చేస్తోంది?',
        'గతంలో మీకు ఆర్థరైటిస్, యూరిక్ యాసిడ్ లేదా ఎముకల బలహీనత ఉన్న చరిత్ర ఉందా?',
        'మీరు పెయిన్ కిల్లర్స్ లేదా కాల్షియం మాత్రలు ఏమైనా వాడారా, మరియు మందుల అలర్జీ ఉందా?',
      ],
    },
  },
  dermatology: {
    id: 'dermatology',
    name: 'Dermatology / Skin Rash / Itching',
    specialty: 'Dermatology',
    regex: /(skin|rash|itching|acne|eczema|allergy|hives|boil|psoriasis|fungal|त्वचा|खुजली|फोड़े|చర్మ|దురద|దద్దుర్లు)/i,
    questions: {
      en: [
        'Where on your body did the rash, itching, or skin lesion start, and has it been spreading to other areas?',
        'Is the area accompanied by blisters, flaking/scaling, oozing fluid, or a burning sensation, and have you started any new soaps, cosmetics, or medicines recently?',
        'On a scale of 1 to 10, how intense is the itching or discomfort, especially at night or in warm conditions?',
        'Do you have a personal or family history of allergies, asthma, eczema, or psoriasis?',
        'Have you applied any creams, ointments, or taken antiallergic tablets, and do you have any known drug allergies?',
      ],
      hi: [
        'शरीर के किस हिस्से पर दाने, खुजली या चकत्ते शुरू हुए हैं, और क्या यह शरीर के दूसरे हिस्सों में भी फैल रहा है?',
        'क्या त्वचा पर छाले, पपड़ी, मवाद, या जलन महसूस हो रही है, और क्या आपने हाल ही में कोई नया साबुन, तेल या दवा शुरू की है?',
        '1 से 10 के पैमाने पर, खुजली या जलन कितनी तेज है, खासकर रात के समय?',
        'శరీరంలో ఏ భాగంలో దద్దుర్లు, దురద లేదా మచ్చలు ప్రారంభమయ్యాయి, మరియు ఇతర భాగాలకు వ్యాపిస్తున్నాయా?',
        'పొక్కులు, పొట్టు రాలడం, నీరు కారడం లేదా మంటగా అనిపిస్తుందా, మరియు ఇటీవల కొత్త సబ్బులు లేదా మందులు వాడారా?',
        '1 నుండి 10 స్కేలులో దురద లేదా అసౌకర్యం ఎంత తీవ్రంగా ఉంది?',
        'గతంలో మీకు లేదా మీ కుటుంబంలో ఎవరికైనా అలర్జీలు లేదా చర్మ సమస్యలు ఉన్నాయా?',
        'మీరు ఏదైనా లేపనం (క్రీమ్) రాశారా లేదా మాత్రలు వాడారా, మరియు మందుల అలెర్జీ ఉందా?',
      ],
    },
  },
  renal: {
    id: 'renal',
    name: 'Nephrology / Renal / Urinary Discomfort',
    specialty: 'Nephrology / Urology',
    regex: /(urin|kidney|flank\s*pain|burning\s*urin|bladder|hematuria|मूत्र|पेशाब|కిడ్నీ|మూత్రం)/i,
    questions: {
      en: [
        'How long have you experienced burning sensation or pain during urination, and is there any flank or lower back pain?',
        'Have you noticed any blood in the urine, cloudiness, strong odor, or difficulty passing urine?',
        'On a scale of 1 to 10, how severe is the burning discomfort or flank pain right now?',
        'Do you have any past history of kidney stones, urinary tract infections (UTIs), or high blood pressure?',
        'Have you taken any urinary alkalizers, antibiotics, or painkillers, and do you have any allergies?',
      ],
      hi: [
        'पेशाब में जलन या दर्द कितने समय से हो रहा है, और क्या कमर या पसलियों के नीचे दर्द महसूस हो रहा है?',
        'क्या पेशाब में खून, मटमैलापन, तेज गंध या पेशाब रुक-रुक कर आने की समस्या है?',
        '1 से 10 के पैमाने पर, पेशाब में जलन या पीठ का दर्द कितना गंभीर है?',
        'क्या आपको पहले कभी गुर्दे की पथरी (किडनी स्टोन) या यूरिन इन्फेक्शन की शिकायत रही है?',
        'क्या आपने कोई एंटीबायोटिक या सिरप लिया है, और क्या किसी दवा से एलर्जी है?',
      ],
      te: [
        'మూత్రంలో మంట లేదా నొప్పి ఎంతకాలంగా ఉంది, మరియు నడుము లేదా కిడ్నీ ప్రాంతంలో నొప్పి ఉందా?',
        'మూత్రంలో రక్తం రావడం, రంగు మారడం లేదా మూత్రం సరిగ్గా రాకపోవడం వంటి లక్షణాలు ఉన్నాయా?',
        '1 నుండి 10 స్కేలులో, మంట లేదా నొప్పి ఎంత తీవ్రంగా ఉంది?',
        'గతంలో కిడ్నీలో రాళ్ళు లేదా యూరినరీ ఇన్ఫెక్షన్లు వచ్చిన చరిత్ర ఉందా?',
        'మీరు ఏదైనా యాంటీబయాటిక్ లేదా మందులు వాడారా, మరియు మందుల అలర్జీ ఉందా?',
      ],
    },
  },
  ent: {
    id: 'ent',
    name: 'ENT / Ear, Nose & Throat Discomfort',
    specialty: 'ENT (Ear, Nose, Throat)',
    regex: /(throat|ear|nose|sinus|tonsil|swallowing|hoarseness|गला|कान|नाक|గొంతు|చెవి|ముక్కు)/i,
    questions: {
      en: [
        'Is the primary issue a sore throat, earache, blocked nose, or sinus pressure/facial pain, and how long has it been bothering you?',
        'Do you have severe pain while swallowing, discharge/ringing in the ear, or voice changes/hoarseness?',
        'On a scale of 1 to 10, how much discomfort is this throat or ear condition causing?',
        'Do you suffer from recurrent tonsillitis, sinus infections, seasonal dust allergies, or nasal polyps?',
        'Have you tried warm salt gargles, steam inhalation, or taken any antibiotics/antihistamines, and any known drug allergies?',
      ],
      hi: [
        'क्या मुख्य समस्या गले में खराश/दर्द, कान का दर्द, नाक बंद होना या साइनस का सिरदर्द है?',
        'क्या खाना या पानी निगलने में तेज दर्द हो रहा है, कान से कोई रिसाव आ रहा है, या आवाज बैठ गई है?',
        '1 से 10 के पैमाने पर, गले या कान का दर्द कितना तेज है?',
        'क्या आपको बार-बार टॉन्सिल, साइनस या धूल-मिट्टी से छींकने की एलर्जी होती है?',
        'क्या आपने गर्म पानी से गरारे किए हैं या कोई दवा ली है, और क्या किसी दवा से एलर्जी है?',
      ],
      te: [
        'మీ ప్రధాన సమస్య గొంతు నొప్పి, చెవి నొప్పి, ముక్కు దిబ్బడ లేదా సైనస్ తలనొప్పినా?',
        'ఆహారం మింగడంలో తీవ్రమైన ఇబ్బంది ఉందా, లేదా చెవి నుండి నీరు కారడం జరుగుతోందా?',
        '1 నుండి 10 స్కేలులో నొప్పి ఎంత తీవ్రంగా ఉంది?',
        'గతంలో మీకు తరచుగా టాన్సిల్స్ లేదా సైనస్ ఇన్ఫెక్షన్లు వచ్చిన సమస్య ఉందా?',
        'మీరు ఉప్పునీటి పుక్కిలింతలు చేశారా లేదా ఏవైనా మందులు వాడారా, మరియు ఏదైనా అలర్జీ ఉందా?',
      ],
    },
  },
};

// Multilingual opening greetings for AYUSH consultation mode
const AYUSH_GREETINGS = {
  en: 'Welcome to MediKiosk AYUSH Case Taking. Please describe what health concern, imbalance, or symptoms you would like to discuss today.',
  hi: 'मेडिकियोस्क आयुष केस-टेकिंग में आपका स्वागत है। कृपया बताएं कि आज आप किस स्वास्थ्य समस्या, असंतुलन या लक्षण के बारे में चर्चा करना चाहते हैं?',
  te: 'మెడికియోస్క్ ఆయుష్ కేస్-టేకింగ్‌కు స్వాగతం. దయచేసి ఈ రోజు మీరు ఎదుర్కొంటున్న ఆరోగ్య సమస్య, అసమతుల్యత లేదా లక్షణాల గురించి చెప్పండి.',
  bn: 'মেডিকিয়স্ক আয়ুশ কেস-টেকিংয়ে আপনাকে স্বাগতম। আজ আপনি কী ধরনের স্বাস্থ্য সমস্যা বা ভারসাম্যহীনতা নিয়ে আলোচনা করতে চান দয়া করে জানান।',
  ta: 'மெடிகியோஸ்க் ஆயுஷ் ஆலோசனைக்கு வரவேற்கிறோம். இன்று நீங்கள் விவாதிக்க விரும்பும் உடல்நலக் குறைபாடு அல்லது அறிகுறிகளை விவரிக்கவும்.',
  mr: 'मेडिकिओस्क आयुष केस-टेकिंगमध्ये आपले स्वागत आहे. कृपया सांगा आज आपल्याला कोणत्या आरोग्याच्या तक्रारी किंवा लक्षणांवर चर्चा करायची आहे?',
  gu: 'મેડિકિઓસ્ક આયુષ કેસ-ટેકિંગમાં આપનું સ્વાગત છે. કૃપા કરીને જણાવો કે આજે તમે કઈ સ્વાસ્થ્ય સમસ્યા અથવા લક્ષણો વિશે ચર્ચા કરવા માંગો છો.',
  kn: 'ಮೆಡಿಕಿಯೋಸ್ಕ್ ಆಯುಷ್ ಕೇಸ್-ಟೇಕಿಂಗ್‌ಗೆ ಸುಸ್ವಾಗತ. ಇಂದು ನೀವು ಯಾವ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ಲಕ್ಷಣಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸಲು ಬಯಸುತ್ತೀರಿ ದಯವಿಟ್ಟು ತಿಳಿಸಿ.',
};

// Fallback AYUSH clinical intake questions
const AYUSH_QUESTIONS = {
  en: [
    'How long have you been experiencing this condition, and at what time of day or seasonal weather do your symptoms usually change or increase?',
    'In AYUSH, your digestion (Agni) is vital. How is your appetite, how do you feel after meals (heaviness, gas, acidity, or normal), and what are your common dietary habits (Ahara)?',
    'How is your bowel movement tendency (Koshtha — smooth, constipated, or loose), and do you naturally feel sensitive to heat/sun or cold climates (Prakriti body constitution)?',
    'How is your sleep quality (Nidra — deep, disturbed, or sleepless), and how is your daily physical routine, exercise, and stress level (Vihara)?',
    'Are you currently taking any AYUSH remedies (Ayurveda, Homeopathy, Unani, Siddha), home preparations, or modern medicines, and do you have any other chronic conditions?',
  ],
  hi: [
    'यह समस्या लगभग कितने समय से है, और दिन के किस समय या मौसम में आपके लक्षण अधिक बढ़ जाते हैं?',
    'आयुष में पाचन (अग्नि) सबसे महत्वपूर्ण है। आपकी भूख कैसी है, भोजन के बाद कैसा महसूस होता है (भारीपन, गैस, जलन या सामान्य), और खान-पान की आदतें (आहार) कैसी हैं?',
    'आपका पेट साफ होने की प्रवृत्ति (कोष्ठ — सामान्य, कब्ज या दस्त) कैसी है, और क्या आपको स्वाभाविक रूप से गर्मी या ठंड अधिक प्रभावित करती है (प्रकृति)?',
    'आपकी नींद की गुणवत्ता (निद्रा — गहरी, टूटी हुई या अनिद्रा) कैसी है, और दैनिक शारीरिक दिनचर्या, व्यायाम व तनाव (विहार) कैसा रहता है?',
    'क्या आप वर्तमान में कोई पारंपरिक आयुष दवा (आयुर्वेदिक, होम्योपैथिक, यूनानी, सिद्धा), घरेलू काढ़ा या एलोपैथिक दवा ले रहे हैं, और कोई अन्य पुरानी बीमारी है?',
  ],
  te: [
    'ఈ సమస్య ఎంతకాలంగా ఉంది, మరియు రోజులోని ఏ సమయంలో లేదా వాతావరణంలో లక్షణాలు ఎక్కువగా ఉంటాయి?',
    'ఆయుష్‌లో జీర్ణశక్తి (అగ్ని) చాలా కీలకం. మీ ఆకలి ఎలా ఉంది, తిన్న తర్వాత ఎలా అనిపిస్తుంది (బరువు, గ్యాస్, మంట లేదా సాధారణం), మరియు ఆహారపు అలవాట్లు (ఆహార) ఏమిటి?',
    'మీ ప్రేగుల కదలికలు (కోష్ఠ — సాఫీగా, మలబద్ధకం లేదా విరేచనాలు) ఎలా ఉన్నాయి, మరియు మీకు సహజంగా వేడి లేదా చలి ఎక్కువగా ప్రభావం చూపుతుందా (ప్రకృతి)?',
    'మీ నిద్ర (నిద్ర — గాఢమైన, కలత నిద్ర లేదా నిద్రలేమి) ఎలా ఉంది, మరియు రోజువారీ శారీరక శ్రమ, వ్యాయామం, మానసిక ఒత్తిడి (విహార) ఎలా ఉంది?',
    'మీరు ప్రస్తుతం ఏవైనా ఆయుష్ మందులు (ఆయుర్వేద, హోమియోపతి, యునాని, సిద్ధ), ఇంటి వైద్యం లేదా అల్లోపతి మందులు వాడుతున్నారా?',
  ],
};

// Fallback general clinical questions
const GENERAL_QUESTIONS = {
  en: [
    'Approximately how long have you been experiencing this, and is the sensation constant or does it come and go?',
    'Have you noticed any other associated symptoms like fever, dizziness, or fatigue?',
    'On a scale of 1 to 10 (1 being mild, 10 being severe), how would you rate your overall discomfort right now?',
    'Do you have any existing chronic conditions like diabetes, high BP, thyroid, or previous hospitalizations?',
    'Are you currently taking any prescription or over-the-counter medicines, and do you have any known drug allergies?',
  ],
  hi: [
    'यह समस्या लगभग कितने समय से बनी हुई है, और क्या यह लगातार रहती है या बीच-बीच में आती है?',
    'क्या आपको इसके साथ कोई अन्य लक्षण जैसे बुखार, चक्कर या अत्यधिक कमजोरी महसूस हो रही है?',
    '1 से 10 के पैमाने पर (1 हल्का, 10 बहुत तेज), इस समय आपकी परेशानी कितनी गंभीर है?',
    'क्या आपको पहले से कोई पुरानी बीमारी है जैसे बीपी, शुगर, थायरॉइड या कोई पिछला ऑपरेशन?',
    'क्या आप वर्तमान में कोई दवा ले रहे हैं, और क्या आपको किसी दवा से कोई एलर्जी है?',
  ],
  te: [
    'ఈ సమస్య సుమారు ఎంతకాలంగా ఉంది, మరియు ఇది నిరంతరం ఉంటుందా లేదా అప్పుడప్పుడు వస్తుందా?',
    'దీనితో పాటు మీకు జ్వరం, తలతిరగడం లేదా తీవ్రమైన నీరసం వంటి ఇతర లక్షణాలు ఏమైనా ఉన్నాయా?',
    '1 నుండి 10 స్కేలులో (1 స్వల్పం, 10 తీవ్రం), ప్రస్తుతం మీ అసౌకర్యం ఎంత ఉంది?',
    'మీకు ఇంతకుముందు బీపీ, షుగర్, థైరాయిడ్ వంటి దీర్ఘకాలిక సమస్యలు ఏమైనా ఉన్నాయా?',
    'మీరు ప్రస్తుతం ఏవైనా మందులు వాడుతున్నారా, మరియు ఏదైనా మందుల అలెర్జీ ఉందా?',
  ],
};

// Check for hesitation/uncertainty
const isUncertainAnswer = (text = '') => {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.includes("don't know") ||
    normalized.includes('dont know') ||
    normalized.includes('not sure') ||
    normalized.includes("don't remember") ||
    normalized.includes('dont remember') ||
    normalized.includes('i am not sure') ||
    normalized.includes('no idea') ||
    normalized.includes('తెలియదు') ||
    normalized.includes('याद नहीं') ||
    normalized.includes('पता नहीं')
  );
};

// Screen for red flags across all text using 14-category emergency engine
const screenRedFlags = (allText = '') => {
  return screenEmergencyRedFlags(allText);
};

// Detect disease from complaint text
const detectDiseaseProfile = (text = '') => {
  for (const key of Object.keys(DISEASE_PROFILES)) {
    const profile = DISEASE_PROFILES[key];
    if (profile.regex.test(text)) {
      return profile;
    }
  }
  return null;
};

// Recommend medical specialty based on extracted complaints
const suggestSpecialty = (allText = '', patientAge = 30) => {
  if (patientAge < 14) {
    return {
      specialty: 'Pediatrics',
      rationale: 'Patient is under 14 years of age, best evaluated by a Pediatric Specialist.',
    };
  }

  const detected = detectDiseaseProfile(allText);
  if (detected && detected.specialty) {
    return {
      specialty: detected.specialty,
      rationale: `Clinical complaints strongly correlate with ${detected.name}. Recommended for evaluation by ${detected.specialty}.`,
    };
  }

  return {
    specialty: 'General Medicine',
    rationale: 'Primary clinical presentation is best comprehensively evaluated by a Physician in General Medicine.',
  };
};

/**
 * Executes a call to Groq API (OpenAI-compatible) using llama-3.3-70b-versatile
 */
async function callGroqLLM({
  groqApiKey,
  systemPrompt,
  userPrompt,
  history = [],
  messages: customMessages,
  model = 'qwen/qwen3.8-27b',
  temperature = 0.3,
  maxTokens = 350,
}) {
  const apiKey = groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    let messages = [];

    if (Array.isArray(customMessages) && customMessages.length > 0) {
      messages = customMessages;
    } else {
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      if (Array.isArray(history)) {
        for (const h of history.slice(-8)) {
          if (h.question) messages.push({ role: 'assistant', content: h.question });
          if (h.answer) messages.push({ role: 'user', content: h.answer });
        }
      }

      if (userPrompt) {
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userPrompt) {
          messages.push({ role: 'user', content: userPrompt });
        }
      }
    }

    const candidateModels = ['qwen/qwen3.8-27b', 'groq/compound', 'qwen/qwen3.6-27b', model].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const candidateModel of candidateModels) {
      try {
        console.log(`[Groq AI] Calling Groq API (${candidateModel}, ${messages.length} messages)...`);
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: candidateModel,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          const elapsed = Date.now() - startTime;
          if (content) {
            console.log(`[Groq AI] Generated response successfully via ${candidateModel} in ${elapsed}ms.`);
            return content;
          }
        } else {
          const errText = await response.text();
          console.warn(`[Groq AI] Model ${candidateModel} HTTP ${response.status}:`, errText);
          if (response.status === 404 || response.status === 400) {
            // Try next available model in cascade
            continue;
          }
          return null;
        }
      } catch (reqErr) {
        console.warn(`[Groq AI] Request error for ${candidateModel}:`, reqErr.message);
      }
    }
    return null;
  } catch (err) {
    console.warn('[Groq AI] Execution error:', err.message);
    return null;
  }
}

// In-memory translation cache for instant response times
const translationCache = new Map();

const DIALECT_CODE_MAP = {
  mai: 'hi',
  doi: 'hi',
  dhn: 'mr',
  kok: 'mr',
  gon: 'te',
  kff: 'te',
  kru: 'hi',
  kfq: 'hi',
  hlb: 'hi',
  bix: 'hi',
  unr: 'hi',
  hoc: 'hi',
  sa: 'hi',
};

/**
 * Universal text translation function
 * Translates any sentence into the target Indian language
 */
async function translateText(text, targetLang = 'en', groqApiKey = '') {
  if (!text || typeof text !== 'string') return text;
  const clean = text.trim();
  if (!clean || targetLang === 'en') return clean;

  const cacheKey = `${targetLang}:${clean.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang;
  const apiKey = groqApiKey || process.env.GROQ_API_KEY;

  let translated = null;

  // 1. Try Groq AI high-fidelity translator if key is provided
  if (apiKey) {
    try {
      const groqRes = await callGroqLLM({
        groqApiKey: apiKey,
        systemPrompt: `You are a medical translator for hospital kiosks in India. Translate the patient health statement or question accurately and naturally into ${targetLangName} in its native script. Translate every single word faithfully without omission. Return ONLY the translated sentence without quotes, explanations, markdown, or notes.`,
        userPrompt: `Translate: "${clean}"`,
        maxTokens: 250,
      });
      if (groqRes && groqRes.length > 0) {
        translated = groqRes.replace(/^["']|["']$/g, '').trim();
      }
    } catch (e) {
      console.warn('[Translate] Groq error:', e.message);
    }
  }

  // 2. Fallback to MyMemory Public API
  if (!translated) {
    try {
      const effectiveCode = DIALECT_CODE_MAP[targetLang] || targetLang;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|${encodeURIComponent(effectiveCode)}`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'MediKiosk-Hospital-Assistant/1.0' },
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json?.responseData?.translatedText) {
          const tText = json.responseData.translatedText.trim();
          if (tText && !tText.toLowerCase().includes('mymemory')) {
            translated = tText;
          }
        }
      }
    } catch (e) {
      console.warn('[Translate] MyMemory error:', e.message);
    }
  }

  const result = translated || clean;
  translationCache.set(cacheKey, result);
  return result;
}

/**
 * Generates the next adaptive follow-up question based on patient symptoms and dynamic Groq AI doctor reasoning
 */
const generateNextQuestion = async ({
  history = [],
  currentAnswer = '',
  language = 'en',
  patientProfile = {},
  groqApiKey = '',
  healthcareMode = 'general_medical',
  communicationMode = 'text',
}) => {
  const turnCount = history.length;
  const conversationText = history.map((h) => `${h.question} ${h.answer}`).join(' ') + ' ' + currentAnswer;
  const redFlagCheck = screenRedFlags(conversationText);

  // Detect which disease the patient is describing
  const detectedProfile = detectDiseaseProfile(conversationText);
  const languageName = LANGUAGE_NAMES[language] || 'English';

  let nextQuestion = '';
  let isComplete = false;
  let aiSource = healthcareMode === 'ayush' ? 'MediKiosk AYUSH Knowledge Core' : 'MediKiosk Clinical Knowledge Base';

  const apiKey = groqApiKey || process.env.GROQ_API_KEY;

  // Detect if patient explicitly indicates they want to finish or have told everything
  const cleanAns = (currentAnswer || '').trim().toLowerCase();
  const isExplicitWrapUp =
    /\b(nothing more to add|that's all|that is all|thats all|all details given|already told everything|told everything|no other symptoms|no other issues|done with details|please finish|finish interview|generate summary|bas itna hi|sab bata diya|chalu anthe|inkem ledu|avvalavudhan)\b/i.test(cleanAns);

  const shouldWrapUp = turnCount >= 6 || (turnCount >= 5 && isExplicitWrapUp);

  // 1. Attempt Groq Doctor LLM generation
  if (apiKey) {
    try {
      let doctorSystemPrompt = '';

      if (healthcareMode === 'ayush') {
        // ----------------- AYUSH MODE SYSTEM PROMPTS -----------------
        if (shouldWrapUp) {
          doctorSystemPrompt = `You are Dr. MediKiosk, an expert AYUSH Intake Specialist (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy) at a smart hospital kiosk in India.
You are concluding an AYUSH clinical case-taking consultation with a patient after gathering symptoms, digestion (Agni), dietary habits (Ahara), lifestyle (Vihara), and sleep (Nidra).

PATIENT PROFILE:
- Preferred Consultation Language: ${languageName} (Language code: ${language})
- Mode: AYUSH Case Taking
- Final Patient Statement: "${currentAnswer}"

TRIAGE DISCUSSION IS NOW FULLY DISCUSSED AND COMPLETE:
1. MANDATORY OPENING - SAY THANK YOU: Start by thanking the patient explicitly for providing their health and lifestyle details in ${languageName} (e.g., in Hindi "अपनी स्वास्थ्य और जीवनशैली की जानकारी साझा करने के लिए धन्यवाद।", in Telugu "మీ ఆరోగ్య మరియు జీవనశైలి వివరాలను పంచుకున్నందుకు ధన్యవాదాలు.").
2. ABSOLUTELY ZERO QUESTIONS: Do NOT ask any questions whatsoever. No further inquiry, no question mark '?'. The discussion is officially finished.
3. REASSURING CONCLUSION: Confirm that their reported symptoms, digestion (Agni), diet (Ahara), lifestyle (Vihara), and sleep (Nidra) have been structured for review by a qualified AYUSH practitioner or physician.
4. MANDATORY TOKEN: You MUST append the exact token [INTERVIEW_COMPLETE] at the very end of your response.

CONSTRAINTS:
- Reply entirely in ${languageName} in its native script.
- 2 short, comforting sentences.
- Do NOT prescribe medications, claim "AI diagnosed your Prakriti", or give definitive diagnoses.`;
        } else {
          let ayushDirective = '';
          if (turnCount === 1) {
            ayushDirective = `AYUSH CLINICAL FOCUS FOR TURN 1 - ONSET, DURATION & AGGRAVATING FACTORS:
- Empathetically acknowledge their primary complaint: "${currentAnswer}".
- Ask how long this imbalance has been present and whether symptoms increase during certain times of day, after eating, or in specific seasons/weather.`;
          } else if (turnCount === 2) {
            ayushDirective = `AYUSH CLINICAL FOCUS FOR TURN 2 - DIGESTION (AGNI) & FOOD HABITS (AHARA):
- Empathetically acknowledge what they said about onset and triggers.
- Inquire about their digestion (Agni): ask how their appetite is, how they feel after meals (heaviness, gas, acidity, or light), and their dietary patterns (Ahara). Explain simply: "In AYUSH, your digestion (Agni) is vital."`;
          } else if (turnCount === 3) {
            ayushDirective = `AYUSH CLINICAL FOCUS FOR TURN 3 - BOWEL TENDENCY (KOSTHTHA) & CLIMATE/BODY SENSITIVITY (PRAKRITI):
- Empathetically acknowledge their digestion response.
- Inquire about their bowel regularity (Koshtha: smooth, constipated, or loose) and whether they are naturally sensitive to hot or cold weather (Prakriti body constitution tendencies).`;
          } else if (turnCount === 4) {
            ayushDirective = `AYUSH CLINICAL FOCUS FOR TURN 4 - SLEEP PATTERNS (NIDRA) & LIFESTYLE / STRESS (VIHARA):
- Empathetically acknowledge their body tendency response.
- Inquire about sleep quality (Nidra: deep, disturbed, or insomnia) and daily physical routine, exercise, and mental stress levels (Vihara).`;
          } else {
            ayushDirective = `AYUSH CLINICAL FOCUS FOR TURN 5 - TRADITIONAL REMEDIES & CURRENT MEDICATIONS:
- Empathetically acknowledge their sleep and lifestyle response.
- Inquire whether they are currently taking any traditional AYUSH remedies (Ayurveda, Homeopathy, Unani, Siddha), home preparations, or modern allopathic medicines, and if they have any known medical conditions.`;
          }

          doctorSystemPrompt = `You are Dr. MediKiosk, an expert AYUSH Intake Specialist (Ayurveda, Yoga & Naturopathy, Unani, Siddha, Homoeopathy) at a smart hospital kiosk in India.
You are conducting a structured, empathetic, pin-to-pin AYUSH intake consultation with a patient.

PATIENT PROFILE:
- Preferred Consultation Language: ${languageName} (Language code: ${language})
- Mode: AYUSH Case Taking
- Current Step: Step ${turnCount} of 5 AYUSH Clinical Dimensions

${ayushDirective}
${
  redFlagCheck.isRedFlag
    ? `
CRITICAL HIGH-PRIORITY EMERGENCY ALERT:
- Patient symptoms indicate an active EMERGENCY: [${(redFlagCheck.matchedCategories || []).map((c) => `${c.emoji} ${c.category}`).join(', ')}].
- While inquiring, you MUST advise the patient with doctor urgency that their symptoms are high-priority and urge them to alert hospital triage nursing staff immediately or call 112/108.
`
    : ''
}

MANDATORY 2-PART CLINICAL RESPONSE STRUCTURE:
1. PART 1: DIRECT EMPATHETIC ACKNOWLEDGMENT of what the patient just answered: "${currentAnswer}".
2. PART 2: ONE TARGETED AYUSH INQUIRY focused on the clinical objective specified above.

CONSTRAINTS:
- Reply entirely in ${languageName} in its native script.
- Keep to 2 natural, comforting sentences.
- Under NO circumstances prescribe medications or claim "AI diagnosed your Prakriti". Everything is patient-reported for professional review.
- NEVER repeat questions that were already asked in previous turns.`;
        }
      } else {
        // ----------------- GENERAL MEDICAL SYSTEM PROMPTS -----------------
        if (shouldWrapUp) {
          doctorSystemPrompt = `You are Dr. MediKiosk, an expert Senior Clinical Triage Physician and Hospital Medical Intake Specialist.
You are concluding a diagnostic intake consultation with a patient at a smart hospital kiosk in India after systematically gathering all pin-to-pin clinical details.

PATIENT PROFILE:
- Preferred Consultation Language: ${languageName} (Language code: ${language})
- Primary Clinical Focus: ${detectedProfile ? detectedProfile.name : 'General Medical Consultation'}
- Final Patient Statement: "${currentAnswer}"

TRIAGE DISCUSSION IS NOW FULLY DISCUSSED AND COMPLETE:
1. MANDATORY OPENING - SAY THANK YOU: You MUST start your response by explicitly thanking the patient: "Thank you for providing all your health details" (or natural equivalent in ${languageName}: e.g. in Hindi "अपनी सभी स्वास्थ्य जानकारी प्रदान करने के लिए धन्यवाद।", in Telugu "మీ ఆరోగ్య వివరాలన్నీ అందించినందుకు ధన్యవాదాలు.").
2. ABSOLUTELY ZERO QUESTIONS: Do NOT ask any questions whatsoever. No further inquiry, no question mark '?'. The discussion is officially finished.
3. REASSURING CONCLUSION: Confirm that their symptoms, duration, severity, chronic medical history, and medication details have all been recorded for the attending physician. Politely inform them their preliminary consultation is complete and to review their compiled Health Summary below.
4. MANDATORY TOKEN: You MUST append the exact token [INTERVIEW_COMPLETE] at the very end of your response.

CONSTRAINTS:
- Reply entirely in ${languageName} in its native script.
- 2 short, comforting, professional sentences.
- Do NOT prescribe medications or give definitive diagnoses.`;
        } else {
          let turnDirective = '';
          if (turnCount === 1) {
            turnDirective = `CLINICAL FOCUS FOR TURN 1 - ONSET, DURATION & CHARACTER:
- Empathetically acknowledge their primary complaint: "${currentAnswer}".
- Inquire about onset, duration, whether it started suddenly or gradually, and whether the symptom is continuous or comes and goes.`;
          } else if (turnCount === 2) {
            turnDirective = `CLINICAL FOCUS FOR TURN 2 - ASSOCIATED SYMPTOMS & ANATOMICAL RADIATION:
- Empathetically acknowledge what they said about timeline and duration.
- Inquire about associated symptoms, anatomical radiation, or specific clinical signs related to ${detectedProfile ? detectedProfile.name : 'their condition'} (e.g., chills, nausea, vomiting, cough, breathing difficulty, dizziness, radiating pain).`;
          } else if (turnCount === 3) {
            turnDirective = `CLINICAL FOCUS FOR TURN 3 - SEVERITY RATING (1-10 SCALE) & DAILY ROUTINE IMPACT:
- Empathetically acknowledge what they shared about associated symptoms (including negative replies like "no vomiting").
- Ask them to rate their pain or discomfort severity on a scale of 1 to 10 (1 mild, 10 severe) and how it affects their daily routine, sleep, eating, or ability to work.`;
          } else if (turnCount === 4) {
            turnDirective = `CLINICAL FOCUS FOR TURN 4 - PAST MEDICAL HISTORY & CHRONIC CONDITIONS:
- Empathetically acknowledge their reported severity level.
- Inquire specifically about past medical history and chronic conditions: ask if they have a history of diabetes, high blood pressure (BP), thyroid disease, asthma, heart conditions, or previous hospitalizations/surgeries.`;
          } else {
            turnDirective = `CLINICAL FOCUS FOR TURN 5 - CURRENT MEDICATIONS & KNOWN DRUG ALLERGIES:
- Empathetically acknowledge their chronic history response.
- Inquire specifically what medications or tablets they have taken today or take regularly, and whether they have any known allergies to medicines (like penicillin, sulfa, or pain relievers).`;
          }

          doctorSystemPrompt = `You are Dr. MediKiosk, an expert Senior Clinical Triage Physician and Hospital Medical Intake Specialist.
You are conducting a thorough, empathetic, pin-to-pin diagnostic intake consultation with a patient at a smart hospital kiosk in India.

PATIENT PROFILE:
- Preferred Consultation Language: ${languageName} (Language code: ${language})
- Primary Clinical Focus: ${detectedProfile ? detectedProfile.name : 'General Medical Consultation'}
- Current Step: Step ${turnCount} of 5 Comprehensive Clinical Dimensions

${turnDirective}
${
  redFlagCheck.isRedFlag
    ? `
CRITICAL HIGH-PRIORITY EMERGENCY ALERT:
- Patient symptoms indicate an active EMERGENCY: [${(redFlagCheck.matchedCategories || []).map((c) => `${c.emoji} ${c.category}`).join(', ')}].
- While inquiring, you MUST advise the patient with doctor urgency that their symptoms are high-priority and urge them to alert hospital triage nursing staff immediately or call 112/108.
`
    : ''
}

MANDATORY 2-PART CLINICAL RESPONSE STRUCTURE:
1. PART 1: DIRECT EMPATHETIC ACKNOWLEDGMENT:
   - Always acknowledge, validate, and respond with genuine doctor warmth to what the patient just answered: "${currentAnswer}".
   - Explicitly mention their stated symptom, duration, negative reply, or severity level before asking the next question.
2. PART 2: THE TARGETED CLINICAL INQUIRY:
   - Ask exactly ONE clear, doctor-grade question focused on the clinical objective specified above.
   - Do NOT ask multiple disconnected questions.
   - Do NOT say goodbye or conclude yet.

CONSTRAINTS:
- Reply entirely in ${languageName} in its native script.
- Keep to 2 natural, comforting, doctor-grade sentences.
- Under NO circumstances prescribe medications (like antibiotics) or state a definitive diagnosis without an in-person doctor check.
- NEVER repeat questions that were already asked in previous turns.`;
        }
      }

      // Build pristine multi-turn history
      const formattedHistory = [];
      for (const h of history) {
        if (h.question) formattedHistory.push({ question: h.question, answer: h.answer || '' });
      }

      const groqResponse = await callGroqLLM({
        groqApiKey: apiKey,
        systemPrompt: doctorSystemPrompt,
        userPrompt: currentAnswer,
        history: formattedHistory,
        temperature: 0.3,
        maxTokens: 350,
      });

      if (groqResponse && groqResponse.length > 8) {
        let cleaned = groqResponse.replace(/\[INTERVIEW_COMPLETE\]/g, '').trim();

        if (groqResponse.includes('[INTERVIEW_COMPLETE]') || shouldWrapUp) {
          isComplete = true;
          // In closing mode, strip any lingering question marks so it NEVER asks another question
          if (cleaned.includes('?')) {
            const sentences = cleaned.split(/(?<=[.!\n])/);
            const nonQuestions = sentences.filter((s) => !s.includes('?'));
            if (nonQuestions.length > 0) {
              cleaned = nonQuestions.join(' ').trim();
            } else {
              cleaned = cleaned.replace(/\?+/g, '.');
            }
          }
          // Ensure it starts with Thank You
          const lowerClean = cleaned.toLowerCase();
          const hasThankYou = lowerClean.includes('thank') || lowerClean.includes('धन्यवाद') || lowerClean.includes('ధన్యవాదాలు') || lowerClean.includes('நன்றி') || lowerClean.includes('ಧನ್ಯವಾದ') || lowerClean.includes('നന്ദി') || lowerClean.includes('ধন্যবাদ');
          if (!hasThankYou) {
            const thankYouPrefix = await translateText(
              healthcareMode === 'ayush'
                ? 'Thank you for sharing your health details.'
                : 'Thank you for providing all your health details.',
              language,
              apiKey
            );
            cleaned = `${thankYouPrefix} ${cleaned}`.trim();
          }
          nextQuestion = cleaned;
        } else {
          nextQuestion = cleaned;
        }
        aiSource = healthcareMode === 'ayush' ? 'Groq AI (AYUSH Intake Engine)' : 'Groq Ultra-Fast AI (Doctor Engine)';
      }
    } catch (llmErr) {
      console.warn('[Groq Doctor AI] Error generating next question:', llmErr.message);
    }
  }

  // 2. Intelligent Dynamic Fallback if Groq was not used or failed
  if (!nextQuestion) {
    if (shouldWrapUp) {
      isComplete = true;
      const closingText =
        healthcareMode === 'ayush'
          ? `Thank you for sharing your health details. Your preliminary AYUSH case-taking is now complete. All your reported symptoms, digestion (Agni), dietary habits (Ahara), lifestyle (Vihara), and sleep (Nidra) patterns have been structured for review by a qualified AYUSH practitioner or physician. Please review your Health Summary below.`
          : `Thank you for providing all your health details. Your preliminary consultation discussion is now complete. All your symptoms, duration, severity, medical history, and medication details have been documented for the attending physician. Please review your Health Summary below.`;
      nextQuestion = await translateText(closingText, language, apiKey);
    } else {
      if (healthcareMode === 'ayush') {
        const langQuestions = AYUSH_QUESTIONS[language] || AYUSH_QUESTIONS.en;
        const qIndex = Math.min(Math.max(0, turnCount - 1), 4);
        const rawQuestion = langQuestions[qIndex] || AYUSH_QUESTIONS.en[qIndex];

        let ackPrefix = '';
        if (language === 'hi') {
          ackPrefix = `आपके द्वारा बताए गए विवरण ("${currentAnswer}") को नोट कर लिया गया है। `;
        } else if (language === 'te') {
          ackPrefix = `మీరు తెలిపిన సమాచారాన్ని ("${currentAnswer}") నమోదు చేసుకున్నాను. `;
        } else {
          ackPrefix = `I have noted what you shared regarding "${currentAnswer}". `;
        }
        nextQuestion = ackPrefix + rawQuestion;
      } else {
        const profileQuestions = detectedProfile && detectedProfile.questions;
        const langQuestions = (profileQuestions && (profileQuestions[language] || profileQuestions.en)) || GENERAL_QUESTIONS[language] || GENERAL_QUESTIONS.en;

        const qIndex = Math.min(Math.max(0, turnCount - 1), 4);
        const rawQuestion = langQuestions[qIndex] || GENERAL_QUESTIONS.en[qIndex];

        let ackPrefix = '';
        if (language === 'hi') {
          ackPrefix = `आपके द्वारा बताए गए विवरण ("${currentAnswer}") को नोट कर लिया गया है। `;
        } else if (language === 'te') {
          ackPrefix = `మీరు తెలిపిన సమాచారాన్ని ("${currentAnswer}") నమోదు చేసుకున్నాను. `;
        } else if (language === 'ta') {
          ackPrefix = `நீங்கள் கூறிய விவரங்களை ("${currentAnswer}") குறித்துக் கொண்டேன். `;
        } else if (language === 'kn') {
          ackPrefix = `ನೀವು ತಿಳಿಸಿದ ವಿವರಗಳನ್ನು ("${currentAnswer}") ದಾಖಲಿಸಿಕೊಂಡಿದ್ದೇನೆ. `;
        } else if (language === 'bn') {
          ackPrefix = `আপনার জানানো বিবরণ ("${currentAnswer}") নথিভুক্ত করা হয়েছে। `;
        } else {
          ackPrefix = `I have noted what you shared regarding "${currentAnswer}". `;
        }

        nextQuestion = ackPrefix + rawQuestion;
        if (!profileQuestions || !profileQuestions[language]) {
          nextQuestion = await translateText(nextQuestion, language, apiKey);
        }
      }
    }
  }

  return {
    question: nextQuestion,
    turnCount: turnCount + 1,
    isComplete,
    redFlagCheck,
    detectedDisease: detectedProfile ? detectedProfile.name : healthcareMode === 'ayush' ? 'AYUSH Case Taking' : 'General Consultation',
    suggestedSpecialty:
      healthcareMode === 'ayush' && !redFlagCheck.isRedFlag
        ? 'AYUSH / Integrative Medicine'
        : detectedProfile
        ? detectedProfile.specialty
        : 'General Medicine',
    aiSource,
  };
};

/**
 * Computes a standardized Case Data Quality Score for clinical triage
 */
const calculateCaseDataQualityScore = ({
  chiefComplaint = '',
  duration = '',
  severity = '',
  medicalHistory = [],
  responses = [],
  documents = [],
  redFlagStatus = 'NONE',
  healthcareMode = 'general_medical',
}) => {
  // 1. Completeness Score (0 - 100)
  let completeness = 35;
  if (chiefComplaint && chiefComplaint.length > 3) completeness += 20;
  if (duration && duration.length > 2) completeness += 15;
  if (severity) completeness += 10;
  if (medicalHistory && medicalHistory.length > 0 && !medicalHistory[0]?.includes('no major chronic')) completeness += 10;
  if (responses && responses.length >= 3) completeness += 10;
  completeness = Math.min(100, completeness);

  // 2. Consistency Score (0 - 100)
  let consistency = 92;
  if (redFlagStatus === 'HIGH_PRIORITY') {
    consistency = 88;
  }

  // 3. Clarity Score (0 - 100)
  let clarity = 80;
  if (responses && responses.length > 0) {
    const totalChars = responses.reduce((acc, r) => acc + (r.answer?.length || 0), 0);
    const avgChars = totalChars / responses.length;
    if (avgChars > 25) clarity = 95;
    else if (avgChars > 12) clarity = 88;
    else clarity = 78;
  }

  const overallScore = Math.round(completeness * 0.45 + consistency * 0.3 + clarity * 0.25);

  return {
    overallScore,
    completenessScore: completeness,
    consistencyScore: consistency,
    clarityScore: clarity,
    verificationStatus: 'NEEDS_VERIFICATION',
  };
};

/**
 * Builds a structured clinical summary from the interview responses
 */
const generateHealthSummary = async ({
  patientProfile = {},
  interviewResponses = [],
  documents = [],
  language = 'en',
  groqApiKey = '',
  healthcareMode = 'general_medical',
  communicationMode = 'text',
}) => {
  const fullText = interviewResponses.map((r) => `${r.question} ${r.answer}`).join(' ');
  let chiefComplaint = interviewResponses[0]?.answer || 'General health consultation';
  const duration = interviewResponses[1]?.answer || 'Reported during intake check-up';

  const redFlagCheck = screenRedFlags(fullText);
  const detectedProfile = detectDiseaseProfile(fullText);
  let specialtyInfo = suggestSpecialty(fullText, patientProfile.age || 30);

  if (healthcareMode === 'ayush' && !redFlagCheck.isRedFlag) {
    specialtyInfo = {
      specialty: 'AYUSH / Integrative Medicine',
      rationale: 'Patient completed AYUSH-oriented intake. Recommended for evaluation by AYUSH practitioner / Integrative Medicine department.',
    };
  }

  // Extract symptoms list heuristically
  const potentialSymptoms = [
    'Fever',
    'Chills',
    'Chest discomfort',
    'Shortness of breath',
    'Headache',
    'Body ache',
    'Cough',
    'Abdominal pain',
    'Acidity / Reflux',
    'Nausea',
    'Vomiting',
    'Dizziness',
    'Joint pain',
    'Swelling',
    'Fatigue',
    'High blood sugar',
    'Frequent urination',
    'Skin rash',
    'Burning urination',
    'Sore throat',
  ];

  const detectedSymptoms = potentialSymptoms.filter((s) => new RegExp(s.split(' ')[0], 'i').test(fullText));
  if (detectedSymptoms.length === 0) {
    detectedSymptoms.push(detectedProfile ? detectedProfile.name : healthcareMode === 'ayush' ? 'AYUSH Case Taking' : 'Unspecified clinical discomfort');
  }

  let summaryText = '';
  if (healthcareMode === 'ayush') {
    summaryText = `Patient ${patientProfile.name || 'Patient'} (${patientProfile.age || 'Age unrecorded'}, ${patientProfile.gender || 'Gender unrecorded'}) completed an AYUSH-oriented clinical intake for chief concern: "${chiefComplaint}". Symptoms duration: ${duration}. Mode: AYUSH Case Taking (Patient-reported). Red-flag screening assessment: ${redFlagCheck.priority}. Suggested department: ${specialtyInfo.specialty}. Note: All AYUSH constitutional and lifestyle findings are patient-reported and require verification by a qualified practitioner.`;
  } else {
    summaryText = `Patient ${patientProfile.name || 'Patient'} (${patientProfile.age || 'Age unrecorded'}, ${patientProfile.gender || 'Gender unrecorded'}) presented with chief concern: "${chiefComplaint}". Disease classification: ${detectedProfile ? detectedProfile.name : 'General clinical presentation'}. Symptoms duration: ${duration}. Red-flag screening assessment: ${redFlagCheck.priority}. Suggested clinical department for consultation: ${specialtyInfo.specialty}. Note: This is an AI-organized summary designed to expedite hospital triage and must be verified by the attending physician.`;
  }

  // If Groq API key is present, generate high-fidelity LLM clinical dossier synthesis
  const apiKey = groqApiKey || process.env.GROQ_API_KEY;
  if (apiKey) {
    const sysPrompt = healthcareMode === 'ayush'
      ? 'You are a hospital AYUSH clinical scribe. Write a concise 2-3 sentence clinical summary of the patient AYUSH intake for the attending practitioner. Emphasize chief complaint, digestion (Agni), lifestyle, and reported symptoms without diagnosing.'
      : 'You are a hospital triage clinical scribe. Write a concise 2-3 sentence clinical summary of the patient intake for the attending doctor. Emphasize chief complaint, timeline, and key reported symptoms without diagnosing.';

    const groqSummary = await callGroqLLM({
      groqApiKey: apiKey,
      systemPrompt: sysPrompt,
      userPrompt: `Patient: ${patientProfile.name || 'Patient'} (${patientProfile.age || 'Age unrecorded'}, ${patientProfile.gender || 'Gender unrecorded'}). Mode: ${healthcareMode}.\nResponses:\n${interviewResponses.map((r) => `Q: ${r.question}\nA: ${r.answer}`).join('\n')}`,
      maxTokens: 300,
    });
    if (groqSummary) {
      summaryText = groqSummary;
    }
  }

  // If language is not English, translate summary narrative for patient's chosen language
  if (language && language !== 'en') {
    chiefComplaint = await translateText(chiefComplaint, language, apiKey);
    summaryText = await translateText(summaryText, language, apiKey);
  }

  // Extract chronic medical history from pin-to-pin responses (respecting negations)
  const chronicKeywords = [
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'sugar', label: 'Diabetes' },
    { key: 'hypertension', label: 'Hypertension (High BP)' },
    { key: 'bp', label: 'Hypertension (High BP)' },
    { key: 'blood pressure', label: 'Hypertension (High BP)' },
    { key: 'asthma', label: 'Asthma / Respiratory Condition' },
    { key: 'thyroid', label: 'Thyroid Disorder' },
    { key: 'heart', label: 'Cardiovascular Condition' },
    { key: 'surgery', label: 'Prior Surgery / Operation' },
    { key: 'kidney', label: 'Renal / Kidney Condition' },
    { key: 'शुगर', label: 'Diabetes' },
    { key: 'बीपी', label: 'Hypertension' },
    { key: 'थायरॉइड', label: 'Thyroid' },
    { key: 'దగ్గు', label: 'Chronic Cough' },
    { key: 'ఆయాసం', label: 'Asthma' },
  ];
  const detectedHistory = [];
  chronicKeywords.forEach(({ key, label }) => {
    const negRegex = new RegExp(`(?:no|not|denies|never had|without)\\s+(?:\\w+\\s+){0,2}${key}`, 'i');
    const isNegated = negRegex.test(fullText);
    const posRegex = new RegExp(`\\b${key}\\b`, 'i');
    if (posRegex.test(fullText) && !isNegated) {
      if (!detectedHistory.includes(label)) detectedHistory.push(label);
    }
  });

  // Extract medicines from pin-to-pin responses
  const medKeywords = ['paracetamol', 'dolo', 'pantocid', 'metformin', 'amoxicillin', 'aspirin', 'azithromycin', 'cetirizine', 'insulin', 'inhaler', 'tablet', 'capsule', 'syrup'];
  const detectedMeds = [];
  medKeywords.forEach((m) => {
    if (new RegExp(`\\b${m}`, 'i').test(fullText)) {
      const formatted = m.charAt(0).toUpperCase() + m.slice(1);
      if (!detectedMeds.includes(formatted)) detectedMeds.push(formatted);
    }
  });

  // AYUSH parameters synthesis
  let ayushAssessment = {
    prakriti: 'Patient-reported constitution traits noted for practitioner evaluation',
    vikriti: 'Current health imbalance under discussion',
    agni: 'Metabolic & digestion status noted during consultation',
    koshtha: 'Bowel tendency recorded for practitioner review',
    ahara: 'Food habits and dietary preferences recorded',
    vihara: 'Daily routine, physical activity, and sleep patterns noted',
    nidra: 'Sleep quality recorded',
    traditionalPractices: [],
    verificationNotice: 'Patient-reported AYUSH information. Qualified AYUSH practitioner verification required.',
  };

  if (healthcareMode === 'ayush') {
    const answersText = interviewResponses.map((r) => r.answer || '').join(' ');
    if (/digestion|gas|bloat|acidity|heavy|भूख|पाचन|అజీర్ణం/i.test(answersText)) {
      ayushAssessment.agni = 'Reported digestive variability or post-meal heaviness/acidity';
    } else {
      ayushAssessment.agni = 'Normal digestive pattern reported';
    }

    if (/constipat|loose|hard|motion|कब्ज|मल|మలబద్ధకం/i.test(answersText)) {
      ayushAssessment.koshtha = 'Irregular / slow bowel tendencies reported';
    } else {
      ayushAssessment.koshtha = 'Regular bowel movements reported';
    }

    if (/heat|hot|pitta|cold|vata|kapha|गर्मी|ठंड|వేడి|చలి/i.test(answersText)) {
      ayushAssessment.prakriti = 'Temperature sensitivity reported — practitioner clinical evaluation required';
    }

    if (/sleep|insomnia|disturbed|wake|नींद|నిద్ర/i.test(answersText)) {
      ayushAssessment.nidra = 'Reported sleep sensitivity or restlessness';
    } else {
      ayushAssessment.nidra = 'Adequate sleep reported';
    }

    const ayushMeds = ['ashwagandha', 'triphala', 'chyawanprash', 'tulsi', 'giloy', 'kadha', 'neem', 'ayurvedic', 'homeopathic', 'unani', 'siddha', 'काढ़ा', 'च्यवनप्राश'];
    ayushMeds.forEach((am) => {
      if (new RegExp(`\\b${am}`, 'i').test(answersText)) {
        ayushAssessment.traditionalPractices.push(am.charAt(0).toUpperCase() + am.slice(1));
      }
    });
  }

  // Calculate Case Data Quality Score
  const caseDataQualityScore = calculateCaseDataQualityScore({
    chiefComplaint,
    duration,
    severity: /severe|intense|sharp|10|9|8|unbearable/i.test(fullText) ? 'Severe' : /mild|1|2|3/i.test(fullText) ? 'Mild' : 'Moderate',
    medicalHistory: detectedHistory,
    responses: interviewResponses,
    documents,
    redFlagStatus: redFlagCheck.priority,
    healthcareMode,
  });

  // Generate structured AI medication suggestions for the attending physician's clinical review
  const aiMedicationSuggestions = generateAiMedicationSuggestions({
    fullText,
    chiefComplaint,
    symptoms: detectedSymptoms,
    detectedProfile,
    healthcareMode,
    patientProfile,
  });

  return {
    chiefComplaint,
    healthcareMode,
    communicationMode,
    language,
    diseaseClassification: detectedProfile ? detectedProfile.name : healthcareMode === 'ayush' ? 'AYUSH Case Taking' : 'General Clinical Presentation',
    symptoms: detectedSymptoms,
    duration,
    severity: /severe|intense|sharp|10|9|8|unbearable/i.test(fullText) ? 'Severe' : /mild|1|2|3/i.test(fullText) ? 'Mild' : 'Moderate',
    medicalHistory: detectedHistory.length > 0 ? detectedHistory : ['Reviewed during clinical intake - no major chronic conditions reported'],
    previousMedicines: detectedMeds.length > 0 ? detectedMeds : ['Reviewed during clinical intake - no regular medicines reported'],
    // Full Q&A Transcript: AI Questions Asked & Patient Answers Given
    interviewResponses: Array.isArray(interviewResponses) && interviewResponses.length > 0
      ? interviewResponses.map((r) => ({
          question: r.question || '',
          answer: r.answer || '',
          inputMode: r.inputMode || communicationMode || 'text',
          timestamp: r.timestamp || new Date(),
        }))
      : [],
    // AI Medication Suggestions for Doctor's Review & Prescription
    aiMedicationSuggestions,
    ayushAssessment,
    caseDataQualityScore,
    redFlagStatus: redFlagCheck.priority,
    redFlagMessage: redFlagCheck.alertMessage,
    suggestedSpecialty: specialtyInfo.specialty,
    specialtyRationale: specialtyInfo.rationale,
    aiGeneratedText: summaryText,
  };
};

/**
 * Intelligent clinical rule-based + evidence-based AI Medication Suggestion generator
 * Explicitly provided as suggestions for the attending doctor's review and prescription
 */
const generateAiMedicationSuggestions = ({
  fullText = '',
  chiefComplaint = '',
  symptoms = [],
  detectedProfile = null,
  healthcareMode = 'general_medical',
  patientProfile = {},
}) => {
  const suggestions = [];
  const text = `${chiefComplaint} ${symptoms.join(' ')} ${fullText}`.toLowerCase();

  if (healthcareMode === 'ayush') {
    // AYUSH suggestions
    if (/fever|temperature|chills|cold|flu|ताप|बुखार|జ్వరం/i.test(text)) {
      suggestions.push({
        medicineName: 'Mahasudarshan Ghan Vati',
        genericName: 'Herbo-mineral classical Ayurvedic formulation',
        category: 'Antipyretic / Ama Pachana',
        form: 'Tablet',
        strength: '500 mg',
        dosage: '2 tablets',
        frequency: 'Twice daily',
        duration: '5 days',
        timing: 'After meals with lukewarm water',
        clinicalRationale: 'Classic formulation for digestive fire stimulation (Deepana-Pachana) and natural body temperature equilibrium.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
      suggestions.push({
        medicineName: 'Giloy (Guduchi) Ghan Vati',
        genericName: 'Tinospora cordifolia extract',
        category: 'Immunomodulator / Rasayana',
        form: 'Tablet',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '7 days',
        timing: 'After meals',
        clinicalRationale: 'Supports cellular immunity and mitigates persistent post-viral fatigue.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
    }

    if (/cough|throat|cold|mucus|chest|asthma|कफ|खांसी|దగ్గు/i.test(text)) {
      suggestions.push({
        medicineName: 'Sitopaladi Churna',
        genericName: 'Cinnamomum, Cardamomum & Bambusa extract',
        category: 'Respiratory / Kapha Hara',
        form: 'Churna (Powder)',
        strength: '3 grams',
        dosage: '1/2 teaspoon',
        frequency: 'Thrice daily',
        duration: '5 days',
        timing: 'With 1 teaspoon pure honey',
        clinicalRationale: 'Soothes inflamed bronchial mucosal lining, reduces paroxysmal dry cough, and facilitates mucus expectoration.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
      suggestions.push({
        medicineName: 'Kanthasudha Vati / Talisadi',
        genericName: 'Talisadi classical formulation',
        category: 'Throat Lozenges',
        form: 'Chewable Tablet',
        strength: '250 mg',
        dosage: '1 tablet',
        frequency: '3-4 times daily',
        duration: '3 days',
        timing: 'Slowly dissolve in mouth',
        clinicalRationale: 'Provides soothing local anti-inflammatory action for pharyngitis and hoarseness.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
    }

    if (/acidity|gas|bloat|constipat|digestion|motion|पेट|कब्ज|అజీర్ణం/i.test(text) || suggestions.length === 0) {
      suggestions.push({
        medicineName: 'Avipattikar Churna',
        genericName: 'Classical Pitta pacifying herbal compound',
        category: 'Digestive / Pitta Shamak',
        form: 'Churna (Powder)',
        strength: '3 grams',
        dosage: '1/2 teaspoon',
        frequency: 'Twice daily',
        duration: '7 days',
        timing: 'Before meals with warm water',
        clinicalRationale: 'Neutralizes excessive stomach acid (Amlapitta), eases heartburn, and regulates bowel motility.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
      suggestions.push({
        medicineName: 'Triphala Tablet / Churna',
        genericName: 'Emblica, Terminalia chebula & bellerica',
        category: 'Bowel Regulator / Rasayana',
        form: 'Tablet',
        strength: '500 mg',
        dosage: '2 tablets',
        frequency: 'Once daily',
        duration: '14 days',
        timing: 'At bedtime with lukewarm water',
        clinicalRationale: 'Promotes regular peristalsis, supports gut microbiome, and detoxifies colon.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
    }

    if (/joint|knee|back|pain|stiff|नसों|दर्द|నొప్పులు/i.test(text)) {
      suggestions.push({
        medicineName: 'Yograj Guggulu',
        genericName: 'Purified Commiphora mukul compound',
        category: 'Anti-inflammatory / Vata Shamak',
        form: 'Tablet',
        strength: '500 mg',
        dosage: '2 tablets',
        frequency: 'Twice daily',
        duration: '14 days',
        timing: 'After meals with warm water',
        clinicalRationale: 'Relieves joint stiffness, nourishes musculoskeletal tissues, and alleviates Vata-induced arthralgia.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
      suggestions.push({
        medicineName: 'Mahanarayan Taila',
        genericName: 'Medicated herbal oil',
        category: 'External Application',
        form: 'Oil',
        strength: '100 ml',
        dosage: 'Gentle massage',
        frequency: 'Twice daily',
        duration: '10 days',
        timing: 'Apply warm over affected joints',
        clinicalRationale: 'Improves synovial circulation and reduces local swelling and tenderness.',
        advisoryNote: 'AYUSH Suggestion for Attending Vaidya — Vaidya will evaluate and prescribe.',
      });
    }

    return suggestions;
  }

  // General Medical Mode Suggestions
  if (/fever|temperature|typhoid|dengue|malaria|chills|shivering|बुखार|ताप|జ్వరం/i.test(text)) {
    suggestions.push({
      medicineName: 'Dolo 650',
      genericName: 'Paracetamol',
      category: 'Antipyretic / Analgesic',
      form: 'Tablet',
      strength: '650 mg',
      dosage: '1 tablet',
      frequency: 'Every 6-8 hours SOS',
      duration: '3-5 days',
      timing: 'After food',
      clinicalRationale: 'First-line antipyretic for temperature reduction (>100°F) and systemic body ache relief. Maximum 3g/day.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
    suggestions.push({
      medicineName: 'Pan 40',
      genericName: 'Pantoprazole',
      category: 'Proton Pump Inhibitor (PPI)',
      form: 'Tablet',
      strength: '40 mg',
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: '5 days',
      timing: '30 minutes before breakfast',
      clinicalRationale: 'Gastric acid suppression to prevent NSAID/illness-related gastritis or hyperacidity.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
    suggestions.push({
      medicineName: 'Electral Sachet',
      genericName: 'Oral Rehydration Salts (WHO Formula)',
      category: 'Electrolyte Restoration',
      form: 'Powder',
      strength: '21.8 g sachet',
      dosage: '1 sachet in 1 Litre boiled & cooled water',
      frequency: 'Sip throughout day',
      duration: '3 days',
      timing: 'Throughout the day',
      clinicalRationale: 'Essential electrolyte restoration and dehydration prophylaxis during acute febrile episode.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
  } else if (/cough|cold|throat|sneez|congestion|phlegm|sputum|bronch|खराश|खांसी|దగ్గు/i.test(text)) {
    suggestions.push({
      medicineName: 'Montair-LC',
      genericName: 'Levocetirizine 5mg + Montelukast 10mg',
      category: 'Antihistamine / Leukotriene Receptor Antagonist',
      form: 'Tablet',
      strength: '5mg / 10mg',
      dosage: '1 tablet',
      frequency: 'Once daily at bedtime',
      duration: '5 days',
      timing: 'At night after food',
      clinicalRationale: 'Controls allergic rhinitis, reduces airway hyperresponsiveness and mucosal swelling.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
    suggestions.push({
      medicineName: 'Ascoril-D Plus / Grilinctus',
      genericName: 'Dextromethorphan + Chlorpheniramine + Phenylephrine',
      category: 'Cough Suppressant & Decongestant',
      form: 'Syrup',
      strength: '100 ml bottle',
      dosage: '10 ml (2 teaspoons)',
      frequency: 'Thrice daily',
      duration: '5 days',
      timing: 'After meals',
      clinicalRationale: 'Relieves irritating dry/allergic cough and clears upper respiratory congestion.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
    suggestions.push({
      medicineName: 'Betadine 2% Gargle',
      genericName: 'Povidone-Iodine 2% w/v',
      category: 'Antiseptic Oral Rinse',
      form: 'Liquid Gargle',
      strength: '50 ml bottle',
      dosage: 'Dilute 1:1 with warm water',
      frequency: 'Thrice daily',
      duration: '4 days',
      timing: 'Gargle for 30 seconds after meals',
      clinicalRationale: 'Local antimicrobial action for pharyngitis, tonsillar inflammation, and throat irritation.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
  } else if (/acidity|gastric|reflux|gerd|stomach|ulcer|bloat|nausea|vomit|heartburn|पेट|गैस|కడుపునొప్పి/i.test(text)) {
    suggestions.push({
      medicineName: 'Pan-D',
      genericName: 'Pantoprazole 40mg + Domperidone 30mg SR',
      category: 'PPI & Prokinetic',
      form: 'Capsule',
      strength: '40mg / 30mg',
      dosage: '1 capsule',
      frequency: 'Once daily',
      duration: '7 days',
      timing: '30 minutes before morning breakfast (Empty stomach)',
      clinicalRationale: 'Potent gastric acid inhibition and accelerated gastric emptying for GERD and dyspepsia.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
    suggestions.push({
      medicineName: 'Mucaine Gel',
      genericName: 'Oxetacaine + Aluminium Hydroxide + Magnesium Hydroxide',
      category: 'Antacid & Local Anaesthetic Mucosal Barrier',
      form: 'Suspension',
      strength: '200 ml',
      dosage: '10 ml',
      frequency: 'Thrice daily (as needed)',
      duration: '5 days',
      timing: '15-30 minutes before meals and at bedtime',
      clinicalRationale: 'Rapid local pain relief for acute epigastric burning and mucosal erosion.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
  } else if (/chest\s*pain|heart|angina|palpitation|pressure\s*in\s*chest|tightness|bp|hypertension|छाती|గుండె/i.test(text)) {
    suggestions.push({
      medicineName: 'Ecosprin 75',
      genericName: 'Aspirin Gastro-resistant',
      category: 'Antiplatelet',
      form: 'Tablet',
      strength: '75 mg',
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: 'Ongoing as advised by cardiologist',
      timing: 'After food',
      clinicalRationale: 'Platelet aggregation inhibition. *Doctor clinical evaluation and ECG mandatory prior to dispensing.*',
      advisoryNote: 'CRITICAL: Doctor Prescription & In-Person 12-Lead ECG mandatory.',
    });
    suggestions.push({
      medicineName: 'Telma 40',
      genericName: 'Telmisartan',
      category: 'Angiotensin II Receptor Blocker (ARB)',
      form: 'Tablet',
      strength: '40 mg',
      dosage: '1 tablet',
      frequency: 'Once daily in morning',
      duration: 'As prescribed by physician',
      timing: 'After breakfast',
      clinicalRationale: '24-hour arterial blood pressure management and cardio-renal protection.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will titrate and prescribe.',
    });
  } else if (/headache|migraine|back\s*pain|joint|body\s*ache|muscle|cramp|नसों|दर्द|నొప్పి/i.test(text)) {
    suggestions.push({
      medicineName: 'Zerodol-SP',
      genericName: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg',
      category: 'NSAID / Anti-inflammatory / Anti-edema',
      form: 'Tablet',
      strength: '100mg/325mg/15mg',
      dosage: '1 tablet',
      frequency: 'Twice daily',
      duration: '3-5 days',
      timing: 'Strictly after meals',
      clinicalRationale: 'Triple-action relief for acute musculoskeletal inflammation, joint pain, and soft-tissue edema.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
    suggestions.push({
      medicineName: 'Pan 40',
      genericName: 'Pantoprazole',
      category: 'Proton Pump Inhibitor (PPI)',
      form: 'Tablet',
      strength: '40 mg',
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: '5 days',
      timing: 'Before breakfast',
      clinicalRationale: 'Prophylactic gastric protection against NSAID-induced mucosal irritation.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
    });
  } else {
    // Default safe first-line clinical support
    suggestions.push({
      medicineName: 'Dolo 650',
      genericName: 'Paracetamol',
      category: 'Analgesic / Antipyretic',
      form: 'Tablet',
      strength: '650 mg',
      dosage: '1 tablet',
      frequency: 'SOS as needed (Max 3/day)',
      duration: '3 days',
      timing: 'After food',
      clinicalRationale: 'General symptom management for headache, malaise, or mild body discomfort.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will evaluate and prescribe.',
    });
    suggestions.push({
      medicineName: 'Pan 40',
      genericName: 'Pantoprazole',
      category: 'Proton Pump Inhibitor (PPI)',
      form: 'Tablet',
      strength: '40 mg',
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: '5 days',
      timing: '30 minutes before breakfast',
      clinicalRationale: 'Gastric acid suppression for digestive comfort during clinical triage.',
      advisoryNote: 'AI Clinical Advisory — Attending doctor will evaluate and prescribe.',
    });
  }

  return suggestions;
};

module.exports = {
  GREETINGS,
  AYUSH_GREETINGS,
  AYUSH_QUESTIONS,
  LANGUAGE_NAMES,
  DISEASE_PROFILES,
  EMERGENCY_RED_FLAG_CATEGORIES,
  screenEmergencyRedFlags,
  screenRedFlags,
  generateNextQuestion,
  generateHealthSummary,
  generateAiMedicationSuggestions,
  calculateCaseDataQualityScore,
  suggestSpecialty,
  detectDiseaseProfile,
  translateText,
  callGroqLLM,
};
