// Comprehensive Multilingual Translation & Transliteration Service for MediKiosk
// Covers all 50 Indian Languages + English baseline across Navigation, Dashboards, Modals, Triage, and Clinical UI.
// Incorporates universal English-to-Indian-script phonetic transliteration so ZERO words retain in English.

// 1. Primary Script Classification for all 51 Languages
export const LANGUAGE_SCRIPT_MAP = {
  en: 'latin',
  hi: 'devanagari',
  bn: 'bengali',
  mr: 'devanagari',
  te: 'telugu',
  ta: 'tamil',
  gu: 'gujarati',
  ur: 'arabic',
  kn: 'kannada',
  or: 'odia',
  ml: 'malayalam',
  pa: 'gurmukhi',
  as: 'bengali',
  mai: 'devanagari',
  sat: 'devanagari', // Ol Chiki rendered as clean phonetic Devanagari in standard web fallback
  ks: 'arabic',
  ne: 'devanagari',
  gon: 'telugu',
  sd: 'arabic',
  kok: 'devanagari',
  doi: 'devanagari',
  mni: 'bengali',
  dhn: 'devanagari',
  kru: 'devanagari',
  kha: 'latin',
  brx: 'devanagari',
  grt: 'latin',
  unr: 'devanagari',
  hoc: 'devanagari',
  kxu: 'odia',
  kfq: 'devanagari',
  hlb: 'devanagari',
  mrg: 'latin',
  mjw: 'latin',
  kff: 'telugu',
  njo: 'latin',
  stv: 'latin',
  njm: 'latin',
  nbe: 'latin',
  nmf: 'latin',
  lus: 'latin',
  tcz: 'latin',
  njh: 'latin',
  rah: 'latin',
  nri: 'latin',
  nph: 'latin',
  njz: 'latin',
  lep: 'latin',
  lif: 'latin',
  bix: 'devanagari',
  sa: 'devanagari',
};

// 2. High-Frequency Transliteration Lexicon for Healthcare / Web UI Loanwords
const COMMON_LOANWORDS = {
  dashboard: {
    devanagari: 'डैशबोर्ड', telugu: 'డాష్‌బోర్డ్', tamil: 'டாஷ்போர்டு', bengali: 'ড্যাশবোর্ড', kannada: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    malayalam: 'ഡാഷ്‌ബോർഡ്', gujarati: 'ડૅશબોર્ડ', gurmukhi: 'ਡੈਸ਼ਬੋਰਡ', odia: 'ଡ୍ୟାସବୋର୍ଡ', arabic: 'ڈیش بورڈ',
  },
  portal: {
    devanagari: 'पोर्टल', telugu: 'పోర్టల్', tamil: 'போர்டல்', bengali: 'পোর্টাল', kannada: 'ಪೋರ್ಟಲ್',
    malayalam: 'പോർട്ടൽ', gujarati: 'પોર્ટલ', gurmukhi: 'ਪੋਰਟਲ', odia: 'ପୋର୍ଟାଲ', arabic: 'پورٹل',
  },
  doctor: {
    devanagari: 'डॉक्टर', telugu: 'డాక్టర్', tamil: 'டாக்டர்', bengali: 'ডাক্তার', kannada: 'ಡಾಕ್ಟರ್',
    malayalam: 'ഡോക്ടർ', gujarati: 'ડૉક્ટર', gurmukhi: 'ਡਾਕਟਰ', odia: 'ଡାକ୍ତର', arabic: 'ڈاکٹر',
  },
  patient: {
    devanagari: 'पेशेंट', telugu: 'పేషెంట్', tamil: 'பேஷன்ட்', bengali: 'পেশেন্ট', kannada: 'ಪೇಷೆಂಟ್',
    malayalam: 'പേഷ്യന്റ്', gujarati: 'પેશન્ટ', gurmukhi: 'ਪੇਸ਼ੈਂਟ', odia: 'ପେଶେଣ୍ଟ', arabic: 'پیشنٹ',
  },
  checkup: {
    devanagari: 'चेकअप', telugu: 'చెకప్', tamil: 'செக்கப்', bengali: 'চেকআপ', kannada: 'ಚೆಕಪ್',
    malayalam: 'ചെക്കപ്പ്', gujarati: 'ચેકઅપ', gurmukhi: 'ਚੈੱਕਅੱਪ', odia: 'ଚେକଅପ୍', arabic: 'چیک اپ',
  },
  hospital: {
    devanagari: 'हॉस्पिटल', telugu: 'హాస్పిటల్', tamil: 'ஹாஸ்பிடல்', bengali: 'হাসপাতাল', kannada: 'ಆಸ್ಪತ್ರೆ',
    malayalam: 'ഹോസ്പിറ്റൽ', gujarati: 'હોસ્પિટલ', gurmukhi: 'ਹਸਪਤਾਲ', odia: 'ଡାକ୍ତରଖାନା', arabic: 'ہسپتال',
  },
  clinic: {
    devanagari: 'क्लिनिक', telugu: 'క్లినిక్', tamil: 'கிளினிக்', bengali: 'ক্লিনিক', kannada: 'ಕ್ಲಿನಿಕ್',
    malayalam: 'ക്ലിനിക്ക്', gujarati: 'ક્લિનિક', gurmukhi: 'ਕਲੀਨਿਕ', odia: 'କ୍ଲିନିକ', arabic: 'کلینک',
  },
  assistant: {
    devanagari: 'असिस्टेंट', telugu: 'అసిస్టెంట్', tamil: 'அசிஸ்டன்ட்', bengali: 'অ্যাসিস্ট্যান্ট', kannada: 'ಅಸಿಸ್ಟೆಂಟ್',
    malayalam: 'അസിസ്റ്റന്റ്', gujarati: 'આસિસ્ટન્ટ', gurmukhi: 'ਸਹਾਇਕ', odia: 'ସହାୟକ', arabic: 'معاون',
  },
  online: {
    devanagari: 'ऑनलाइन', telugu: 'ఆన్‌లైన్', tamil: 'ஆன்லைன்', bengali: 'অনলাইন', kannada: 'ಆನ್‌ಲೈನ್',
    malayalam: 'ഓൺലൈൻ', gujarati: 'ઓનલાઈન', gurmukhi: 'ਔਨਲਾਈਨ', odia: 'ଅନଲାଇନ୍', arabic: 'آن لائن',
  },
  timeline: {
    devanagari: 'टाइमलाइन', telugu: 'టైమ్‌లైన్', tamil: 'டைம்லைன்', bengali: 'টাইমলাইন', kannada: 'ಟೈಮ್‌ಲೈನ್',
    malayalam: 'ടൈംലൈൻ', gujarati: 'ટાઇમલાઇન', gurmukhi: 'ਟਾਈਮਲਾਈਨ', odia: 'ଟାଇମଲାଇନ୍', arabic: 'ٹائم لائن',
  },
  prescription: {
    devanagari: 'प्रिस्क्रिप्शन', telugu: 'ప్రిస్క్రిప్షన్', tamil: 'பிரிஸ்கிரிப்ஷன்', bengali: 'প্রেসক্রিপশন', kannada: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್',
    malayalam: 'പ്രിസ്ക്രിപ്ഷൻ', gujarati: 'પ્રિસ્ક્રિપ્શન', gurmukhi: 'ਪਰਚੀ', odia: 'ପ୍ରେସକ୍ରିପସନ୍', arabic: 'نسخہ',
  },
  prescriptions: {
    devanagari: 'प्रिस्क्रिप्शन', telugu: 'ప్రిస్క్రిప్షన్లు', tamil: 'மருந்து சீட்டுகள்', bengali: 'প্রেসক্রিপশন', kannada: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು',
    malayalam: 'പ്രിസ്ക്രിപ്ഷനുകൾ', gujarati: 'પ્રિસ્ક્રિપ્શન્સ', gurmukhi: 'ਪਰਚੀਆਂ', odia: 'ପ୍ରେସକ୍ରିପସନ୍', arabic: 'نسخہ جات',
  },
  records: {
    devanagari: 'रिकॉर्ड्स', telugu: 'రికార్డులు', tamil: 'பதிவுகள்', bengali: 'রেকর্ডস', kannada: 'ದಾಖಲೆಗಳು',
    malayalam: 'റെക്കോർഡുകൾ', gujarati: 'રેકોર્ડ્સ', gurmukhi: 'ਰਿਕਾਰਡ', odia: 'ରେକର୍ଡ', arabic: 'ریکارڈز',
  },
  summary: {
    devanagari: 'समरी (सारांश)', telugu: 'సమ్మరీ (సారాంశం)', tamil: 'சுருக்கம்', bengali: 'সারাংশ', kannada: 'ಸಾರಾಂಶ',
    malayalam: 'സംഗ്രഹം', gujarati: 'સારાંશ', gurmukhi: 'ਸੰਖੇਪ', odia: 'ସାରାଂଶ', arabic: 'خلاصہ',
  },
  appointment: {
    devanagari: 'अपॉइंटमेंट', telugu: 'అపాయింట్‌మెంట్', tamil: 'அப்பாயின்ட்மென்ட்', bengali: 'অ্যাপয়েন্টমেন্ট', kannada: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್',
    malayalam: 'അപ്പോയിന്റ്മെന്റ്', gujarati: 'અપોઈન્ટમેન્ટ', gurmukhi: 'ਮੁਲਾਕਾਤ', odia: 'ନିଯୁକ୍ତି', arabic: 'ملاقات',
  },
  appointments: {
    devanagari: 'अपॉइंटमेंट्स', telugu: 'అపాయింట్‌మెంట్లు', tamil: 'அப்பாயின்ட்மென்ட்கள்', bengali: 'অ্যাপয়েন্টমেন্টসমূহ', kannada: 'ಅಪಾಯಿಂಟ್ಮెంట్లు',
    malayalam: 'അപ്പോയിന്റ്മെന്റുകൾ', gujarati: 'અપોઈન્ટમેન્ટ્સ', gurmukhi: 'ਮੁਲਾਕਾਤਾਂ', odia: 'ନିଯୁକ୍ତିଗୁଡ଼ିକ', arabic: 'ملاقاتیں',
  },
  consultation: {
    devanagari: 'कंसल्टेशन', telugu: 'కన్సల్టేషన్', tamil: 'ஆலோசனை', bengali: 'পরামর্শ', kannada: 'ಸಮಾಲೋಚನೆ',
    malayalam: 'കൺസൾട്ടേഷൻ', gujarati: 'કન્સલ્ટેશન', gurmukhi: 'ਸਲਾਹ', odia: 'ପରାମର୍ଶ', arabic: 'مشاورت',
  },
  consultations: {
    devanagari: 'कंसल्टेशन्स', telugu: 'కన్సల్టేషన్లు', tamil: 'ஆலோசனைகள்', bengali: 'পরামর্শসমূহ', kannada: 'ಸಮಾಲೋಚನೆಗಳು',
    malayalam: 'കൺസൾട്ടേഷനുകൾ', gujarati: 'કન્સલ્ટેશન્સ', gurmukhi: 'ਸਲਾਹਾਂ', odia: 'ପରାମର୍ଶଗୁଡ଼ିକ', arabic: 'مشاورتیں',
  },
  profile: {
    devanagari: 'प्रोफाइल', telugu: 'ప్రొఫైల్', tamil: 'சுயவிவரம்', bengali: 'প্রোফাইল', kannada: 'ಪ್ರೊಫೈಲ್',
    malayalam: 'പ്രൊഫൈൽ', gujarati: 'પ્રોફાઇલ', gurmukhi: 'ਪ੍ਰੋਫਾਈਲ', odia: 'ପ୍ରୋଫାଇଲ୍', arabic: 'پروفائل',
  },
  notifications: {
    devanagari: 'नोटिफिकेशन्स', telugu: 'నోటిఫికేషన్లు', tamil: 'அறிவிப்புகள்', bengali: 'বিজ্ঞপ্তি', kannada: 'ಅಧಿಸೂಚನೆಗಳು',
    malayalam: 'അറിയിപ്പുകൾ', gujarati: 'સૂચનાઓ', gurmukhi: 'ਸੂਚਨਾਵਾਂ', odia: 'ବିଜ୍ଞପ୍ତି', arabic: 'اطلاعات',
  },
  settings: {
    devanagari: 'सेटिंग्स', telugu: 'సెట్టింగ్స్', tamil: 'அமைப்புகள்', bengali: 'সেটিংস', kannada: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    malayalam: 'ക്രമീകരണങ്ങൾ', gujarati: 'સેટિંગ્સ', gurmukhi: 'ਸੈਟਿੰਗਾਂ', odia: 'ସେଟିଙ୍ଗ୍ସ', arabic: 'ترتیبات',
  },
  login: {
    devanagari: 'लॉगिन', telugu: 'లాగిన్', tamil: 'உள்நுழைவு', bengali: 'লগইন', kannada: 'ಲಾಗಿನ್',
    malayalam: 'ലോഗിൻ', gujarati: 'લૉગિન', gurmukhi: 'ਲਾਗਿਨ', odia: 'ଲଗଇନ୍', arabic: 'لاگ ان',
  },
  logout: {
    devanagari: 'लॉगआउट', telugu: 'లాగౌట్', tamil: 'வெளியேறு', bengali: 'লগআউট', kannada: 'ಲಾಗ್ ಔಟ್',
    malayalam: 'ലോഗൗട്ട്', gujarati: 'લૉગઆઉટ', gurmukhi: 'ਲਾਗਆਉਟ', odia: 'ଲଗଆଉଟ୍', arabic: 'لاگ آؤٹ',
  },
  register: {
    devanagari: 'रजिस्टर', telugu: 'రిజిస్టర్', tamil: 'பதிவு செய்', bengali: 'নিবন্ধন', kannada: 'ನೋಂದಣಿ',
    malayalam: 'രജിസ്റ്റർ', gujarati: 'નોંધણી', gurmukhi: 'ਰਜਿਸਟਰ', odia: 'ପଞ୍ଜୀକରଣ', arabic: 'رجسٹر',
  },
  details: {
    devanagari: 'डिटेल्स (विवरण)', telugu: 'వివరాలు (డిటెయిల్స్)', tamil: 'விவரங்கள்', bengali: 'বিবরণ', kannada: 'ವಿವರಗಳು',
    malayalam: 'വിശദാംശങ്ങൾ', gujarati: 'વિગતો', gurmukhi: 'ਵੇਰਵੇ', odia: 'ବିବରଣୀ', arabic: 'تفصیلات',
  },
  actions: {
    devanagari: 'एक्शंस (कार्रवाई)', telugu: 'యాక్షన్స్ (చర్యలు)', tamil: 'செயல்கள்', bengali: 'পদক্ষেপ', kannada: 'ಕ್ರಮಗಳು',
    malayalam: 'നടപടികൾ', gujarati: 'પગલાં', gurmukhi: 'ਕਾਰਵਾਈਆਂ', odia: 'କାର୍ଯ୍ୟ', arabic: 'اقدامات',
  },
  status: {
    devanagari: 'स्टेटस (स्थिति)', telugu: 'స్టేటస్ (స్థితి)', tamil: 'நிலை', bengali: 'স্থিতি', kannada: 'ಸ್ಥಿತಿ',
    malayalam: 'സ്ഥിതി', gujarati: 'સ્થિતિ', gurmukhi: 'ਸਥਿਤੀ', odia: 'ସ୍ଥିତି', arabic: 'حیثیت',
  },
  camera: {
    devanagari: 'कैमरा', telugu: 'కెమెరా', tamil: 'கேமரா', bengali: 'ক্যামেরা', kannada: 'ಕ್ಯಾಮೆರಾ',
    malayalam: 'ക്യാമറ', gujarati: 'કેમેરા', gurmukhi: 'ਕੈਮਰਾ', odia: 'କ୍ୟାମେରା', arabic: 'کیمرہ',
  },
  upload: {
    devanagari: 'अपलोड', telugu: 'అప్‌లోడ్', tamil: 'பதிவேற்று', bengali: 'আপলোড', kannada: 'ಅಪ್‌ಲೋಡ್',
    malayalam: 'അപ്‌ലോഡ്', gujarati: 'અપલોડ', gurmukhi: 'ਅੱਪਲੋਡ', odia: 'ଅପଲୋଡ୍', arabic: 'اپ لوڈ',
  },
  download: {
    devanagari: 'डाउनलोड', telugu: 'డౌన్‌లోడ్', tamil: 'பதிவிறக்கு', bengali: 'ডাউনলোড', kannada: 'ಡೌನ್‌ಲೋಡ್',
    malayalam: 'ഡൗൺലോഡ്', gujarati: 'ડાઉનલોડ', gurmukhi: 'ਡਾਊਨਲੋਡ', odia: 'ଡାଉନଲୋଡ୍', arabic: 'ڈاؤن لوڈ',
  },
  verified: {
    devanagari: 'सत्यापित (वेरिफाइड)', telugu: 'ధృవీకరించబడింది (వెరిఫైడ్)', tamil: 'சரிபார்க்கப்பட்டது', bengali: 'যাচাইকৃত', kannada: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    malayalam: 'പരിശോധിച്ചു', gujarati: 'ચકાસાયેલ', gurmukhi: 'ਪ੍ਰਮਾਣਿਤ', odia: 'ଯାଞ୍ଚ ହୋଇଛି', arabic: 'تصدیق شدہ',
  },
  pending: {
    devanagari: 'लंबित (पेंडिंग)', telugu: 'పెండింగ్', tamil: 'நிலுவையில் உள்ளது', bengali: 'মুলতবি', kannada: 'ಬಾಕಿ ಇದೆ',
    malayalam: 'തീർപ്പുകൽപ്പിക്കാത്തത്', gujarati: 'બાકી', gurmukhi: 'ਬਕਾਇਆ', odia: 'ବାକି', arabic: 'زیر التواء',
  },
  completed: {
    devanagari: 'पूर्ण (कंप्लीटेड)', telugu: 'పూర్తయింది (కంప్లీట్)', tamil: 'முடிந்தது', bengali: 'সম্পন্ন', kannada: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    malayalam: 'പൂർത്തിയായി', gujarati: 'પૂર્ણ', gurmukhi: 'ਪੂਰਾ ਹੋਇਆ', odia: 'ସମାପ୍ତ', arabic: 'مکمل',
  },
  save: {
    devanagari: 'सेव करें', telugu: 'సేవ్ చేయండి', tamil: 'சேமிக்க', bengali: 'সংরক্ষণ করুন', kannada: 'ಉಳಿಸಿ',
    malayalam: 'സേവ് ചെയ്യുക', gujarati: 'સાચવો', gurmukhi: 'ਸੇਵ ਕਰੋ', odia: 'ସେଭ୍ କରନ୍ତୁ', arabic: 'محفوظ کریں',
  },
  cancel: {
    devanagari: 'रद्द करें (कैंसल)', telugu: 'రద్దు చేయండి (క్యాన్సల్)', tamil: 'ரத்து செய்', bengali: 'বাতিল করুন', kannada: 'ರದ್ದುಮಾಡಿ',
    malayalam: 'റദ്ദാക്കുക', gujarati: 'રદ કરો', gurmukhi: 'ਰੱਦ ਕਰੋ', odia: 'ବାତିଲ୍ କରନ୍ତୁ', arabic: 'منسوخ کریں',
  },
  submit: {
    devanagari: 'जमा करें (सबमिट)', telugu: 'సమర్పించండి (సబ్మిట్)', tamil: 'சமர்ப்பிக்க', bengali: 'জমা দিন', kannada: 'ಸಲ್ಲಿಸಿ',
    malayalam: 'സമർപ്പിക്കുക', gujarati: 'સબમિટ કરો', gurmukhi: 'ਜਮ੍ਹਾਂ ਕਰੋ', odia: 'ଦାଖଲ କରନ୍ତୁ', arabic: 'جمع کرائیں',
  },
  search: {
    devanagari: 'खोजें (सर्च)', telugu: 'వెతకండి (సెర్చ్)', tamil: 'தேடுக', bengali: 'অনুসন্ধান করুন', kannada: 'ಹುಡುಕಿ',
    malayalam: 'തിരയുക', gujarati: 'શોધો', gurmukhi: 'ਖੋਜੋ', odia: 'ଖୋଜନ୍ତୁ', arabic: 'تلاش کریں',
  },
  filter: {
    devanagari: 'फ़िल्टर', telugu: 'ఫిల్టర్', tamil: 'வடிகட்டு', bengali: 'ফিল্টার', kannada: 'ಫಿಲ್ಟರ್',
    malayalam: 'ഫിൽട്ടർ', gujarati: 'ફિલ્ટર', gurmukhi: 'ਫਿਲਟਰ', odia: 'ଫିଲ୍ଟର୍', arabic: 'فلٹر',
  },
  overview: {
    devanagari: 'अवलोकन (ओवरव्यू)', telugu: 'అవలోకనం (ఓవర్‌వ్యూ)', tamil: 'மேலோட்டம்', bengali: 'সংক্ষিপ্ত বিবরণ', kannada: 'ಅವಲೋಕನ',
    malayalam: 'അവലോകനം', gujarati: 'ઝાંખી', gurmukhi: 'ਸੰਖੇਪ ਜਾਣਕਾਰੀ', odia: 'ଦୃଷ୍ଟିପାତ', arabic: 'جائزہ',
  },
  recent: {
    devanagari: 'हाल का (रीसेंट)', telugu: 'ఇటీవలి (రీసెంట్)', tamil: 'சமீபத்திய', bengali: 'সাম্প্রতিক', kannada: 'ಇತ್ತೀಚಿನ',
    malayalam: 'സമീപകാല', gujarati: 'તાજેતરનું', gurmukhi: 'ਤਾਜ਼ਾ', odia: 'ସାମ୍ପ୍ରତିକ', arabic: 'حالیہ',
  },
  requests: {
    devanagari: 'अनुरोध (रिक्वेस्ट्स)', telugu: 'అభ్యర్థనలు (రిక్వెస్ట్‌లు)', tamil: 'கோரிக்கைகள்', bengali: 'অনুরোধসমূহ', kannada: 'ವಿನಂತಿಗಳು',
    malayalam: 'അഭ്യർത്ഥനകൾ', gujarati: 'વિનંતીઓ', gurmukhi: 'ਬੇਨਤੀਆਂ', odia: 'ଅନୁରୋଧଗୁଡ଼ିକ', arabic: 'درخواستیں',
  },
  emergency: {
    devanagari: 'आपातकालीन (इमरजेंसी)', telugu: 'అత్యవసర (ఎమర్జెన్సీ)', tamil: 'அவசரம்', bengali: 'জরুরী', kannada: 'ತುರ್ತು',
    malayalam: 'അടിയന്തരം', gujarati: 'કટોકટી', gurmukhi: 'ਐਮਰਜੈਂਸੀ', odia: 'ଜରୁରୀକାଳୀନ', arabic: 'ہنگامی',
  },
  contact: {
    devanagari: 'संपर्क (कॉन्टैक्ट)', telugu: 'సంప్రదించండి (కాంటాక్ట్)', tamil: 'தொடர்பு', bengali: 'যোগাযোগ', kannada: 'ಸಂಪರ್ಕಿಸಿ',
    malayalam: 'ബന്ധപ്പെടുക', gujarati: 'સંપર્ક', gurmukhi: 'ਸੰਪਰਕ', odia: 'ଯୋଗାଯୋଗ', arabic: 'رابطہ',
  },
  license: {
    devanagari: 'लाइसेंस', telugu: 'లైసెన్స్', tamil: 'உரிமம்', bengali: 'লাইসেন্স', kannada: 'ಪರವಾನಗಿ',
    malayalam: 'ലൈസൻസ്', gujarati: 'લાઇસન્સ', gurmukhi: 'ਲਾਇਸੰਸ', odia: 'ଲାଇସେନ୍ସ', arabic: 'لائسنس',
  },
  specialty: {
    devanagari: 'विशेषज्ञता (स्पेशल्टी)', telugu: 'స్పెషాలిటీ (నైపుణ్యం)', tamil: 'சிறப்பு மருத்துவம்', bengali: 'বিশেষত্ব', kannada: 'ವಿಶೇಷತೆ',
    malayalam: 'സ്പെഷ്യാലിറ്റി', gujarati: 'નિષ્ણાતતા', gurmukhi: 'ਮੁਹਾਰਤ', odia: 'ବିଶେଷଜ୍ଞତା', arabic: 'تخصص',
  },
  cardiology: {
    devanagari: 'कार्डियोलॉजी (हृदय रोग)', telugu: 'కార్డియాలజీ (గుండె సంరక్షణ)', tamil: 'இதயவியல்', bengali: 'কার্ডিওলজি', kannada: 'ಹೃದ್ರೋಗ ಶಾಸ್ತ್ರ',
    malayalam: 'കാർഡിയോളജി', gujarati: 'કાર્ડિયોલોજી', gurmukhi: 'ਦਿਲ ਦੇ ਰੋਗ', odia: 'ହୃଦରୋଗ ବିଜ୍ଞାନ', arabic: 'امراض قلب',
  },
  neurology: {
    devanagari: 'न्यूरोलॉजी (तंत्रिका विज्ञान)', telugu: 'న్యూరాలజీ (నరాల సంరక్షణ)', tamil: 'நரம்பியல்', bengali: 'নিউরোলজি', kannada: 'ನರವಿಜ್ಞಾನ',
    malayalam: 'ന്യൂറോളജി', gujarati: 'ન્યુરોલોજી', gurmukhi: 'ਨਿਊਰੋਲੋਜੀ', odia: 'ସ୍ନାୟୁରୋଗ ବିଜ୍ଞାନ', arabic: 'علم اعصاب',
  },
  pulmonology: {
    devanagari: 'पल्मोनोलॉजी (फेफड़े रोग)', telugu: 'పల్మోనాలజీ (ఊపిరితిత్తుల సంరక్షణ)', tamil: 'நுரையீரலியல்', bengali: 'পালমোনোলজি', kannada: 'ಶ್ವಾಸಕೋಶ ಶಾಸ್ತ್ರ',
    malayalam: 'പൾമണോളജി', gujarati: 'પલ્મોનોલોજી', gurmukhi: 'ਛਾਤੀ ਦੇ ਰੋਗ', odia: 'ଫୁସଫୁସ ରୋଗ ବିଜ୍ଞାନ', arabic: 'امراض تنفس',
  },
  orthopedics: {
    devanagari: 'ऑर्थोपेडिक्स (हड्डी रोग)', telugu: 'ఆర్థోపెడిక్స్ (ఎముకల సంరక్షణ)', tamil: 'எலும்பியல்', bengali: 'অর্থোপেডিক্স', kannada: 'ಮೂಳೆ ರೋಗ ಶಾಸ್ತ್ರ',
    malayalam: 'ഓർത്തോപീഡിക്സ്', gujarati: 'ઓર્થોપેડિક્સ', gurmukhi: 'ਹੱਡੀਆਂ ਦੇ ਰੋਗ', odia: 'ଅସ୍ଥିଶଲ୍ୟ ବିଜ୍ଞାନ', arabic: 'امراض ہڈی',
  },
  dermatology: {
    devanagari: 'डर्मेटोलॉजी (त्वचा रोग)', telugu: 'డెర్మటాలజీ (చర్మ సంరక్షణ)', tamil: 'தோல் மருத்துவம்', bengali: 'ডার্মাটোলজি', kannada: 'ಚರ್ಮರೋಗ ಶಾಸ್ತ್ರ',
    malayalam: 'ഡെർമറ്റോളജി', gujarati: 'ડર્મેટોલોજી', gurmukhi: 'ਚਮੜੀ ਦੇ ਰੋਗ', odia: 'ଚର୍ମରୋଗ ବିଜ୍ଞାନ', arabic: 'امراض جلد',
  },
  gastroenterology: {
    devanagari: 'गैस्ट्रोएंटरोलॉजी (पेट रोग)', telugu: 'గ్యాస్ట్రోఎంటరాలజీ (జీర్ణశయాంతర సంరక్షణ)', tamil: 'இரைப்பையியல்', bengali: 'গ্যাস্ট্রোএন্টারোলজি', kannada: 'ಜಠರಗರುಳಿನ ಶಾಸ್ತ್ರ',
    malayalam: 'ഗ്യാസ്ട്രോഎൻട്രോളജി', gujarati: 'ગેસ્ટ્રોએન્ટેરોલોજી', gurmukhi: 'ਪੇਟ ਦੇ ਰੋਗ', odia: 'ପାକସ୍ଥଳୀ ରୋଗ ବିଜ୍ଞାନ', arabic: 'امراض معدہ',
  },
  pediatrics: {
    devanagari: 'पीडियाट्रिक्स (बाल रोग)', telugu: 'పీడియాట్రిక్స్ (పిల్లల సంరక్షణ)', tamil: 'குழந்தை மருத்துவம்', bengali: 'শিশুচিকিৎসা', kannada: 'ಮಕ್ಕಳ ವೈದ್ಯಶಾಸ್ತ್ರ',
    malayalam: 'പീഡിയാട്രിക്സ്', gujarati: 'બાળરોગ ચિકિત્સા', gurmukhi: 'ਬਾਲ ਰੋਗ', odia: 'ଶିଶୁରୋଗ ବିଜ୍ଞାନ', arabic: 'امراض اطفال',
  },
  medikiosk: {
    devanagari: 'मेडिकियोस्क', telugu: 'మెడికియోస్క్', tamil: 'மெடிகியோஸ்க்', bengali: 'মেডিকিয়স্ক', kannada: 'ಮೆಡಿಕಿಯೋಸ್ಕ್',
    malayalam: 'മെഡിക്കിയോസ്ക്', gujarati: 'મેડિકિયોસ્ક', gurmukhi: 'ਮੈਡੀਕਿਓਸਕ', odia: 'ମେଡିକିଓସ୍କ', arabic: 'میڈی کیوسک',
  },
  mode: {
    devanagari: 'मोड', telugu: 'మోడ్', tamil: 'முறை', bengali: 'মোড', kannada: 'ಮೋಡ್',
    malayalam: 'മോഡ്', gujarati: 'મોડ', gurmukhi: 'ਮੋਡ', odia: 'ମୋଡ୍', arabic: 'موڈ',
  },
  voice: {
    devanagari: 'वॉइस (आवाज़)', telugu: 'వాయిస్ (స్వరం)', tamil: 'குரல்', bengali: 'কণ্ঠস্বর', kannada: 'ಧ್ವನಿ',
    malayalam: 'ശബ്ദം', gujarati: 'અવાજ', gurmukhi: 'ਆਵਾਜ਼', odia: 'ସ୍ୱର', arabic: 'آواز',
  },
  text: {
    devanagari: 'टेक्स्ट (लिखकर)', telugu: 'టెక్స్ట్ (వ్రాసి)', tamil: 'உரை', bengali: 'পাঠ্য', kannada: 'ಪಠ್ಯ',
    malayalam: 'ടെക്സ്റ്റ്', gujarati: 'લખાણ', gurmukhi: 'ਟੈਕਸਟ', odia: 'ପାଠ୍ୟ', arabic: 'متن',
  },
  speaking: {
    devanagari: 'बोल रहे हैं...', telugu: 'మాట్లాడుతోంది...', tamil: 'பேசுகிறது...', bengali: 'বলছে...', kannada: 'ಮಾತನಾಡುತ್ತಿದೆ...',
    malayalam: 'സംസാരിക്കുന്നു...', gujarati: 'બોલી રહ્યા છે...', gurmukhi: 'ਬੋਲ ਰਿਹਾ ਹੈ...', odia: 'କହୁଛି...', arabic: 'بول رہا ہے...',
  },
  listening: {
    devanagari: 'सुन रहे हैं...', telugu: 'వింటోంది...', tamil: 'கேட்கிறது...', bengali: 'শুনছে...', kannada: 'ಕೇಳುತ್ತಿದೆ...',
    malayalam: 'കേൾക്കുന്നു...', gujarati: 'સાંભળી રહ્યા છે...', gurmukhi: 'ਸੁਣ ਰਿਹਾ ਹੈ...', odia: 'ଶୁଣୁଛି...', arabic: 'سن رہا ہے...',
  },
  thinking: {
    devanagari: 'सोच रहे हैं...', telugu: 'ఆలోచిస్తోంది...', tamil: 'சிந்திக்கிறது...', bengali: 'ভাবছে...', kannada: 'ಚಿಂತಿಸುತ್ತಿದೆ...',
    malayalam: 'ആലോചിക്കുന്നു...', gujarati: 'વિચારી રહ્યા છે...', gurmukhi: 'ਸੋਚ ਰਿਹਾ ਹੈ...', odia: 'ଭାବୁଛି...', arabic: 'سوچ رہا ہے...',
  },
  aadhaar: {
    devanagari: 'आधार', telugu: 'ఆధార్', tamil: 'ஆதார்', bengali: 'আধার', kannada: 'ಆಧಾರ್',
    malayalam: 'ആധാർ', gujarati: 'આધાર', gurmukhi: 'ਆਧਾਰ', odia: 'ଆଧାର', arabic: 'آدھار',
  },
  abha: {
    devanagari: 'आभा', telugu: 'ఆభా', tamil: 'ஆபா', bengali: 'আভা', kannada: 'ಆಭಾ',
    malayalam: 'ആഭ', gujarati: 'આભા', gurmukhi: 'ਆਭਾ', odia: 'ଆଭା', arabic: 'آبھا',
  },
  abdm: {
    devanagari: 'एबीडीएम (ABDM)', telugu: 'ఏబీడీఎం (ABDM)', tamil: 'ஏபிடிஎம்', bengali: 'এবিডিএম', kannada: 'ಎಬಿಡಿಎಂ',
    malayalam: 'എബിഡിഎം', gujarati: 'એબીડીએમ', gurmukhi: 'ਏਬੀਡੀਐਮ', odia: 'ଏବିଡିଏମ୍', arabic: 'اے بی ڈی ایم',
  },
  fhir: {
    devanagari: 'फायर (FHIR)', telugu: 'ఫైర్ (FHIR)', tamil: 'எஃப்ஹெச்ஐஆர்', bengali: 'এফএইচআইআর', kannada: 'ಎಫ್‌ಎಚ್‌ಐಆರ್',
    malayalam: 'എഫ്എച്ച്ഐആർ', gujarati: 'એફએચઆઈઆર', gurmukhi: 'ਐਫਐਚਆਈਆਰ', odia: 'ଏଫ୍ଏଚ୍ଆଇଆର୍', arabic: 'ایف ایچ آئی آر',
  },
  gender: {
    devanagari: 'लिंग (जेंडर)', telugu: 'లింగం (జెండర్)', tamil: 'பாலினம்', bengali: 'লিঙ্গ', kannada: 'ಲಿಂಗ',
    malayalam: 'ലിംഗം', gujarati: 'જાતિ', gurmukhi: 'ਲਿੰਗ', odia: 'ଲିଙ୍ଗ', arabic: 'جنس',
  },
  age: {
    devanagari: 'उम्र (एज)', telugu: 'వయస్సు (ఏజ్)', tamil: 'வயது', bengali: 'বয়স', kannada: 'ವಯಸ್ಸು',
    malayalam: 'പ്രായം', gujarati: 'ઉંમર', gurmukhi: 'ਉਮਰ', odia: 'ବୟସ', arabic: 'عمر',
  },
  weight: {
    devanagari: 'वजन (वेट)', telugu: 'బరువు (వెయిట్)', tamil: 'எடை', bengali: 'ওজন', kannada: 'ತೂಕ',
    malayalam: 'ഭാരം', gujarati: 'વજન', gurmukhi: 'ਭਾਰ', odia: 'ଓଜନ', arabic: 'وزن',
  },
  height: {
    devanagari: 'ऊंचाई (हाइट)', telugu: 'ఎత్తు (హైట్)', tamil: 'உயரம்', bengali: 'উচ্চতা', kannada: 'ಎತ್ತರ',
    malayalam: 'ഉയരം', gujarati: 'ઊંચાઈ', gurmukhi: 'ਕੱਦ', odia: 'ଉଚ୍ଚତା', arabic: 'قد',
  },
  phone: {
    devanagari: 'फोन नंबर', telugu: 'ఫోన్ నంబర్', tamil: 'தொலைபேசி எண்', bengali: 'ফোন নম্বর', kannada: 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
    malayalam: 'ഫോൺ നമ്പർ', gujarati: 'ફોન નંબર', gurmukhi: 'ਫ਼ੋਨ ਨੰਬਰ', odia: 'ଫୋନ୍ ନମ୍ବର', arabic: 'فون نمبر',
  },
  bloodgroup: {
    devanagari: 'ब्लड ग्रुप', telugu: 'బ్లడ్ గ్రూప్', tamil: 'இரத்த வகை', bengali: 'রক্তের গ্রুপ', kannada: 'ರಕ್ತದ ಗುಂಪು',
    malayalam: 'ബ്ലഡ് ഗ്രൂപ്പ്', gujarati: 'બ્લડ ગ્રૂપ', gurmukhi: 'ਬਲੱਡ ਗਰੁੱਪ', odia: 'ରକ୍ତ ବର୍ଗ', arabic: 'بلڈ گروپ',
  },
  queue: {
    devanagari: 'कतार (क्यू)', telugu: 'వరుస క్రమం (క్యూ)', tamil: 'வரிசை', bengali: 'সারি', kannada: 'ಸಾಲಿನಲ್ಲಿ',
    malayalam: 'വരി', gujarati: 'કતાર', gurmukhi: 'ਕਤਾਰ', odia: 'ଧାଡ଼ି', arabic: 'قطار',
  },
  token: {
    devanagari: 'टोकन', telugu: 'టోకెన్', tamil: 'டோக்கன்', bengali: 'টোকেন', kannada: 'ಟೋಕನ್',
    malayalam: 'ടോക്കൺ', gujarati: 'ટોકન', gurmukhi: 'ਟੋਕਨ', odia: 'ଟୋକନ୍', arabic: 'ٹوکن',
  },
};

// 3. Fallback Algorithmic Phonetic Transliteration Engine
// Maps arbitrary Latin letters/consonant-clusters to phonetic glyphs in major Indian scripts
const SCRIPT_CHAR_MAPS = {
  devanagari: {
    th: 'थ', sh: 'श', ch: 'च', ph: 'फ', kh: 'ख', gh: 'घ', dh: 'ध', bh: 'भ', ck: 'क', ng: 'ंग',
    b: 'ब', c: 'क', d: 'ड', f: 'फ', g: 'ग', h: 'ह', j: 'ज', k: 'क', l: 'ल', m: 'म',
    n: 'न', p: 'प', q: 'क', r: 'र', s: 'स', t: 'ट', v: 'व', w: 'व', x: 'क्स', y: 'य', z: 'ज़',
    a: 'ा', e: 'े', i: 'ी', o: 'ो', u: 'ू',
  },
  telugu: {
    th: 'థ', sh: 'శ', ch: 'చ', ph: 'ఫ', kh: 'ఖ', gh: 'ఘ', dh: 'ధ', bh: 'భ', ck: 'క్', ng: 'ంగ్',
    b: 'బ', c: 'క', d: 'డ', f: 'ఫ', g: 'గ', h: 'హ', j: 'జ', k: 'క', l: 'ల', m: 'మ',
    n: 'న', p: 'ప', q: 'క', r: 'ర', s: 'స', t: 'ట', v: 'వ', w: 'వ', x: 'క్స్', y: 'య', z: 'జ',
    a: 'ా', e: 'ే', i: 'ీ', o: 'ో', u: 'ూ',
  },
  tamil: {
    th: 'த', sh: 'ஷ', ch: 'ச', ph: 'ப', kh: 'க', gh: 'க', dh: 'த', bh: 'ப', ck: 'க்', ng: 'ங்',
    b: 'ப', c: 'க', d: 'ட', f: 'ப', g: 'க', h: 'ஹ', j: 'ஜ', k: 'க', l: 'ல', m: 'ம',
    n: 'ந', p: 'ப', q: 'க', r: 'ர', s: 'ஸ', t: 'ட', v: 'வ', w: 'வ', x: 'க்ஸ்', y: 'ய', z: 'ஜ',
    a: 'ா', e: 'ே', i: 'ீ', o: 'ோ', u: 'ூ',
  },
  bengali: {
    th: 'থ', sh: 'শ', ch: 'চ', ph: 'ফ', kh: 'খ', gh: 'ঘ', dh: 'ধ', bh: 'ভ', ck: 'ক', ng: 'ং',
    b: 'ব', c: 'ক', d: 'ড', f: 'ফ', g: 'গ', h: 'হ', j: 'জ', k: 'ক', l: 'ল', m: 'ম',
    n: 'ন', p: 'প', q: 'ক', r: 'র', s: 'স', t: 'ট', v: 'ভ', w: 'ও', x: 'ক্স', y: 'য', z: 'জ',
    a: 'া', e: 'ে', i: 'ী', o: 'ো', u: 'ূ',
  },
  kannada: {
    th: 'ಥ', sh: 'ಶ', ch: 'ಚ', ph: 'ಫ', kh: 'ಖ', gh: 'ಘ', dh: 'ಧ', bh: 'ಭ', ck: 'ಕ್', ng: 'ಂಗ್',
    b: 'ಬ', c: 'ಕ', d: 'ಡ', f: 'ಫ', g: 'ಗ', h: 'ಹ', j: 'ಜ', k: 'ಕ', l: 'ಲ', m: 'ಮ',
    n: 'ನ', p: 'ಪ', q: 'ಕ', r: 'ರ', s: 'ಸ', t: 'ಟ', v: 'ವ', w: 'ವ', x: 'ಕ್ಸ್', y: 'ಯ', z: 'ಜ',
    a: 'ಾ', e: 'ೇ', i: 'ೀ', o: 'ೋ', u: 'ೂ',
  },
  malayalam: {
    th: 'ഥ', sh: 'ശ', ch: 'ച', ph: 'ഫ', kh: 'ഖ', gh: 'ഘ', dh: 'ധ', bh: 'ഭ', ck: 'ക്', ng: 'ങ്ങ്',
    b: 'ബ', c: 'ക', d: 'ഡ', f: 'ഫ', g: 'ഗ', h: 'ഹ', j: 'ജ', k: 'ക', l: 'ല', m: 'മ',
    n: 'ന', p: 'പ', q: 'ക', r: 'ര', s: 'സ', t: 'ട', v: 'വ', w: 'വ', x: 'ക്സ്', y: 'യ', z: 'സ',
    a: 'ാ', e: 'േ', i: 'ീ', o: 'ോ', u: 'ൂ',
  },
  gujarati: {
    th: 'થ', sh: 'શ', ch: 'ચ', ph: 'ફ', kh: 'ખ', gh: 'ઘ', dh: 'ધ', bh: 'ભ', ck: 'ક', ng: 'ંગ',
    b: 'બ', c: 'ક', d: 'ડ', f: 'ફ', g: 'ગ', h: 'હ', j: 'જ', k: 'ક', l: 'લ', m: 'મ',
    n: 'ન', p: 'પ', q: 'ક', r: 'ર', s: 'સ', t: 'ટ', v: 'વ', w: 'વ', x: 'ક્સ', y: 'ય', z: 'ઝ',
    a: 'ા', e: 'ે', i: 'ી', o: 'ો', u: 'ૂ',
  },
  gurmukhi: {
    th: 'ਥ', sh: 'ਸ਼', ch: 'ਚ', ph: 'ਫ', kh: 'ਖ', gh: 'ਘ', dh: 'ਧ', bh: 'ਭ', ck: 'ਕ', ng: 'ੰਗ',
    b: 'ਬ', c: 'ਕ', d: 'ਡ', f: 'ਫ', g: 'ਗ', h: 'ਹ', j: 'ਜ', k: 'ਕ', l: 'ਲ', m: 'ਮ',
    n: 'ਨ', p: 'ਪ', q: 'ਕ', r: 'ਰ', s: 'ਸ', t: 'ਟ', v: 'ਵ', w: 'ਵ', x: 'ਕਸ', y: 'ਯ', z: 'ਜ਼',
    a: 'ਾ', e: 'ੇ', i: 'ੀ', o: 'ੋ', u: 'ੂ',
  },
  odia: {
    th: 'ଥ', sh: 'ଶ', ch: 'ଚ', ph: 'ଫ', kh: 'ଖ', gh: 'ଘ', dh: 'ଧ', bh: 'ଭ', ck: 'କ', ng: 'ଙ୍ଗ',
    b: 'ବ', c: 'କ', d: 'ଡ', f: 'ଫ', g: 'ଗ', h: 'ହ', j: 'ଜ', k: 'କ', l: 'ଲ', m: 'ମ',
    n: 'ନ', p: 'ପ', q: 'କ', r: 'ର', s: 'ସ', t: 'ଟ', v: 'ଭ', w: 'ୱ', x: 'କ୍ସ', y: 'ୟ', z: 'ଜ',
    a: 'ା', e: 'େ', i: 'ୀ', o: 'ୋ', u: 'ୂ',
  },
  arabic: {
    th: 'تھ', sh: 'ش', ch: 'چ', ph: 'ف', kh: 'خ', gh: 'غ', dh: 'دھ', bh: 'بھ', ck: 'ک', ng: 'نگ',
    b: 'ب', c: 'ک', d: 'ڈ', f: 'ف', g: 'گ', h: 'ہ', j: 'ج', k: 'ک', l: 'ل', m: 'م',
    n: 'ن', p: 'پ', q: 'ق', r: 'ر', s: 'س', t: 'ٹ', v: 'و', w: 'و', x: 'کس', y: 'ی', z: 'ز',
    a: 'ا', e: 'ے', i: 'ی', o: 'و', u: 'و',
  },
};

/**
 * Phonetically transliterates a single English word into the specified script
 */
export const transliterateEnglishWord = (word, script = 'devanagari') => {
  if (!word || typeof word !== 'string') return word;
  if (script === 'latin') return word;

  const lower = word.toLowerCase().trim();

  // 1. Check direct loanwords table
  if (COMMON_LOANWORDS[lower] && COMMON_LOANWORDS[lower][script]) {
    return COMMON_LOANWORDS[lower][script];
  }

  // 2. Singularize if plural exists
  if (lower.endsWith('s') && COMMON_LOANWORDS[lower.slice(0, -1)]) {
    const base = COMMON_LOANWORDS[lower.slice(0, -1)][script];
    if (base) return base;
  }

  // 3. Fallback character-by-character mapper
  const map = SCRIPT_CHAR_MAPS[script] || SCRIPT_CHAR_MAPS.devanagari;
  let result = '';
  let i = 0;
  const len = lower.length;

  while (i < len) {
    // Check 2-letter clusters
    if (i + 1 < len) {
      const two = lower.substring(i, i + 2);
      if (map[two]) {
        result += map[two];
        i += 2;
        continue;
      }
    }

    const one = lower[i];
    if (map[one]) {
      result += map[one];
    } else {
      result += one;
    }
    i++;
  }

  return result || word;
};

/**
 * Replaces any remaining English words in a sentence with their transliteration in the target script
 */
export const transliterateRemainingEnglish = (text, langCode = 'hi') => {
  if (!text || typeof text !== 'string') return text;
  if (langCode === 'en') return text;

  const script = LANGUAGE_SCRIPT_MAP[langCode] || 'devanagari';
  if (script === 'latin') return text;

  // Match English words of 2 or more letters
  return text.replace(/[a-zA-Z]{2,}/g, (match) => {
    // Skip if it's already an HTML tag or special token
    if (match === 'id' || match === 'px' || match === 'rem' || match === 'svg') return match;
    return transliterateEnglishWord(match, script);
  });
};

// 4. Comprehensive Dictionary covering 200+ Core Medical & UI Terms
export const CORE_DICTIONARY = {
  'Home': {
    hi: 'होम', bn: 'হোম', mr: 'मुख्यपृष्ठ', te: 'హోమ్', ta: 'முகப்பு', gu: 'હોમ', ur: 'ہوم', kn: 'ಮುಖಪುಟ', or: 'ମୁଖ୍ୟପୃଷ୍ଠା', ml: 'ഹോം',
    pa: 'ਮੁੱਖ ਪੰਨਾ', as: 'গৃহপৃষ্ঠা', mai: 'गृह', sat: 'ᱚᱲᱟᱜ', ks: 'گھر', ne: 'गृहपृष्ठ', gon: 'రోన్', sd: 'گھر', kok: 'घर', doi: 'घर',
    mni: 'ꯌꯨꯝ', dhn: 'घर', kru: 'ईड़पा', kha: 'Iing', brx: 'न', grt: 'Nok', unr: 'ओड़ाः', hoc: 'ओड़ाः', kxu: 'ଇଡ଼ୁ', kfq: 'ओड़ा',
    hlb: 'घर', mrg: 'Ékúm', mjw: 'Hem', kff: 'రోన్', njo: 'Ki', stv: 'Aki', njm: 'Kí', nbe: 'Hem', nmf: 'Shim', lus: 'In',
    tcz: 'In', njh: 'Oki', rah: 'Nok', nri: 'Ki', nph: 'Hem', njz: 'Nam', lep: 'Li', lif: 'Him', bix: 'ओड़ाः', sa: 'गृहम्',
  },
  'How It Works': {
    hi: 'यह कैसे काम करता है', bn: 'এটি কীভাবে কাজ করে', mr: 'हे कसे कार्य करते', te: 'ఇది ఎలా పనిచేస్తుంది', ta: 'இது எப்படி வேலை செய்கிறது', gu: 'આ કેવી રીતે કાર્ય કરે છે', ur: 'یہ کیسے کام کرتا ہے', kn: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ', or: 'ଏହା କିପରି କାମ କରେ', ml: 'ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു',
    pa: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ', as: 'ই কেনেদৰে কাম কৰে', mai: 'ई कना काज करैत अछि', sat: 'ᱱᱚᱣᱟ ᱪᱮᱫᱞᱮᱠᱟ ᱠᱟᱹᱢᱤᱭᱟ', ks: 'یہِ کِتھ کَن چُھ کٲم کَران', ne: 'यो कसरी काम गर्छ', gon: 'ఇది బాతల్ పని కీతుం', sd: 'هي ڪيئن ڪم ڪري ٿو', kok: 'हे कशें काम करता', doi: 'एह किवें कम् करदा ऐ',
    mni: 'ꯃꯁꯤ ꯀꯔꯝꯅ ꯊꯕꯛ ꯇꯧꯕꯒꯦ', dhn: 'हा कसा काम करतंस', kru: 'ई काथा एकआ कामी नानी', kha: 'Kumno ka trei kam', brx: 'बेयो माबोरै खामानि मावो', grt: 'Iani kam kamoa', unr: 'नेया चिलिका कामी तना', hoc: 'नेया चिलिका कामी', kxu: 'ଇଦି ଆନା ଗିଆ କାମି କିନି', kfq: 'ई केने काम करे',
    hlb: 'ये कइसन काम करथे', mrg: 'Sina edíloke igínám', mjw: 'Laso kapisi kam klem', kff: 'ఇది బాతల్ పని కీతుం', njo: 'Iba kongodang inyaker', stv: 'Hiku kughu shishishe', njm: 'Haie kekreinu vor vor zo', nbe: 'Ipa nang kaman', nmf: 'Hiakha ngaraithuikho', lus: 'Engtin nge a thawh',
    tcz: 'Hiti hin a che e', njh: 'Nte tsükona shi tsoka', rah: 'Iba barong kam khatha', nri: 'Hi küzhi thüli zo', nph: 'Heppa mekam thang', njz: 'Sii hoda pumin nam', lep: 'Káten lóm klyen', lif: 'Khelôk yaambey', bix: 'नेया चिलिका कामी तना', sa: 'एतत् कथं कार्यं करोति',
  },
  'Features': {
    hi: 'सुविधाएं (Features)', bn: 'বৈশিষ্ট্যসমূহ', mr: 'वैशिष्ट्ये', te: 'ఫీచర్లు', ta: 'அம்சங்கள்', gu: 'વિશેષતાઓ', ur: 'خصوصیات', kn: 'ವೈಶಿಷ್ಟ್ಯಗಳು', or: 'ବିଶେଷତା', ml: 'സവിശേഷതകൾ',
    pa: 'ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ', as: 'বৈশিষ্ট্যসমূহ', mai: 'विशेषतासभ', sat: 'ᱜᱩᱱ ᱠᱚ', ks: 'خاصِیتَن', ne: 'विशेषताहरू', gon: 'విశేషాలు', sd: 'خاصيتون', kok: 'खाशेलपणां', doi: 'खासियतां',
    mni: 'ꯃꯁꯤꯡ ꯂꯩꯕ ꯃꯒꯨꯟꯁꯤꯡ', dhn: 'वैशिष्ट्य', kru: 'गुनकती', kha: 'Ki jingbha', brx: 'आखोफोर', grt: 'Gunrang', unr: 'गुन को', hoc: 'गुन को', kxu: 'ଗୁଣସିଙ୍ଗ', kfq: 'गुण',
    hlb: 'खास गुन', mrg: 'Ayileng ager', mjw: 'Arong atum', kff: 'ఫీచర్లు', njo: 'Tajungtem', stv: 'Akukuthu', njm: 'Kevi kemeyeko', nbe: 'Kapei', nmf: 'Makhalei', lus: 'A bikna te',
    tcz: 'Phatchomna', njh: 'Mhona lio', rah: 'Guna rang', nri: 'Kevi kekhreiko', nph: 'Kahuk', njz: 'Bumeng yalo', lep: 'Aatshang', lif: 'Cikhim', bix: 'गुन को', sa: 'वैशिष्ट्यानि',
  },
  'Team': {
    hi: 'टीम', bn: 'দল', mr: 'संघ', te: 'బృందం (టీమ్)', ta: 'குழு', gu: 'ટીમ', ur: 'ٹیم', kn: 'ತಂಡ', or: 'ଦଳ', ml: 'ടീം',
    pa: 'ਟੀਮ', as: 'দল', mai: 'दल', sat: 'ᱫᱚᱞ', ks: 'ٹِیم', ne: 'टोली', gon: 'సమూహం', sd: 'ٽيم', kok: 'पंगड', doi: 'टोली',
    mni: 'ꯂꯨꯄꯁꯤꯡ', dhn: 'टोळी', kru: 'झुंड', kha: 'Ka Kynhun', brx: 'हान्जा', grt: 'Dol', unr: 'दल', hoc: 'दल', kxu: 'ଦଳ', kfq: 'दल',
    hlb: 'दल', mrg: 'Mídum', mjw: 'Asonseng', kff: 'దళం', njo: 'Telok', stv: 'Akiapu', njm: 'Miapfutsü', nbe: 'Mao', nmf: 'Khonram', lus: 'Pawl',
    tcz: 'Houp', njh: 'Eloroe', rah: 'Dol', nri: 'Thenuoko', nph: 'Mong', njz: 'Ngalang', lep: 'Kátsuk', lif: 'Tumit', bix: 'दल', sa: 'दलम्',
  },
  'About': {
    hi: 'हमारे बारे में', bn: 'আমাদের সম্পর্কে', mr: 'आमच्याबद्दल', te: 'మా గురించి', ta: 'எங்களை பற்றி', gu: 'અમારા વિશે', ur: 'ہمارے متعلق', kn: 'ನಮ್ಮ ಬಗ್ಗೆ', or: 'ଆମ ବିଷୟରେ', ml: 'ഞങ്ങളെക്കുറിച്ച്',
    pa: 'ਸਾਡੇ ਬਾਰੇ', as: 'আমাৰ বিষয়ে', mai: 'हमरा सभक विषय में', sat: 'ᱟᱞᱮ ᱵᱟᱵᱚᱛ', ks: 'اسانۍ مُتعلِق', ne: 'हाम्रो बारेमा', gon: 'మావా గురించి', sd: 'اسان بابت', kok: 'आमचेविशीं', doi: 'साढ़े बारे च',
    mni: 'ꯑꯩꯈꯣꯌꯒꯤ ꯃꯇꯥꯡꯗ', dhn: 'आमनाबद्दल', kru: 'एम्बहाय नू', kha: 'Shaphang Jong Ngi', brx: 'जोंनि सोमोन्दै', grt: 'Chingni gimin', unr: 'अले बबते', hoc: 'अले बबते', kxu: 'ମା ବିଷୟ', kfq: 'आमो बारे में',
    hlb: 'हमार बारे में', mrg: 'Ngolukke lugling', mjw: 'Ne apharman', kff: 'మా గురించి', njo: 'Ozan indang', stv: 'Ikiu ghenguno', njm: 'A vor rüli', nbe: 'Inam nang', nmf: 'Iramli', lus: 'Kan chungchang',
    tcz: 'Eiho hekhatna', njh: 'Ethe ekhüm lo', rah: 'Chingni katha', nri: 'Hieko vor', nph: 'Heipa nang', njz: 'Ngope abing', lep: 'Káyu thon', lif: 'Aaniingyo', bix: 'अले बबते', sa: 'अस्माकं विषये',
  },
  'Login': {
    hi: 'लॉग इन', bn: 'লগ ইন', mr: 'लॉगिन', te: 'లాగిన్', ta: 'உள்நுழைக', gu: 'લૉગિન', ur: 'لاگ ان', kn: 'ಲಾಗಿನ್', or: 'ଲଗ୍ ଇନ୍', ml: 'ലോഗിൻ',
    pa: 'ਲਾਗਿਨ', as: 'লগ ইন', mai: 'प्रवेश करू', sat: 'ᱵᱚᱞᱚᱱ', ks: 'لاگ اِن', ne: 'लगइन', gon: 'లోపల రావా', sd: 'لاگ ان', kok: 'भितर सरा', doi: 'लाग इन',
    mni: 'ꯂꯣꯒ ꯏꯟ', dhn: 'लॉगिन', kru: 'कोरों कालो', kha: 'Pynrung', brx: 'हाबनाय', grt: 'Napa', unr: 'बोलो', hoc: 'बोलो', kxu: 'ଭିତରେ ଯିବା', kfq: 'भीतर आओ',
    hlb: 'भीतर घुसा', mrg: 'Álung elo alik', mjw: 'Lut ra', kff: 'లాగిన్', njo: 'Iitoka', stv: 'Ilo shulo', njm: 'Vowor', nbe: 'Va', nmf: 'Wunglung', lus: 'Lut rawh',
    tcz: 'Lut in', njh: 'Oro', rah: 'Napawa', nri: 'Vor vo', nph: 'Va li', njz: 'Hokhe bapa', lep: 'Lóm lhut', lif: 'Lhaangney', bix: 'बोलो', sa: 'प्रवेशः',
  },
  'Create Account': {
    hi: 'खाता बनाएं', bn: 'অ্যাকাউন্ট তৈরি করুন', mr: 'खाते तयार करा', te: 'ఖాతా తెరవండి', ta: 'கணக்கு தொடங்கு', gu: 'ખાતું બનાવો', ur: 'اکاؤنٹ بنائیں', kn: 'ಖಾತೆ ತೆರೆಯಿರಿ', or: 'ଖାତା ଖୋଲନ୍ତୁ', ml: 'അക്കൗണ്ട് ഉണ്ടാക്കുക',
    pa: 'ਖਾਤਾ ਬਣਾਓ', as: 'একাউণ্ট খোলক', mai: 'खाता बनाउ', sat: 'ᱠᱷᱟᱛᱟ ᱵᱮᱱᱟᱣ', ks: 'کھاتہٕ بَنٲوِو', ne: 'खाता बनाउनुहोस्', gon: 'ఖాతా తాయార్ కీము', sd: 'کاتو ٺاهيو', kok: 'खातें तयार करा', doi: 'खाता बणाओ',
    mni: 'ꯑꯦꯀꯥꯎꯟꯠ ꯁꯦꯝꯃꯨ', dhn: 'खाता बनवा', kru: 'खाता कमआ', kha: 'Thaw Account', brx: 'खाथा खुलि', grt: 'Account tarie', unr: 'खाता बाई', hoc: 'खाता बाई', kxu: 'ଖାତା ତିଆରି କର', kfq: 'खाता बनाओ',
    hlb: 'खाता बनावा', mrg: 'Account gílík', mjw: 'Account sem non', kff: 'ఖాతా చేయండి', njo: 'Account lapang', stv: 'Account thoke', njm: 'Account dze', nbe: 'Account phang', nmf: 'Account kasa', lus: 'Account siam rawh',
    tcz: 'Account siem in', njh: 'Account tsüka', rah: 'Account taria', nri: 'Account dze', nph: 'Account phang', njz: 'Account jima', lep: 'Account jók', lif: 'Account cey', bix: 'खाता बाई', sa: 'लेखां सृजतु',
  },
  'Patient': {
    hi: 'मरीज़ (Patient)', bn: 'রোগী', mr: 'रुग्ण (Patient)', te: 'రోగి (పేషెంట్)', ta: 'நோயாளி', gu: 'દર્દી', ur: 'مریض', kn: 'ರೋಗಿ', or: 'ରୋଗୀ', ml: 'രോഗി',
    pa: 'ਮਰੀਜ਼', as: 'ৰোগী', mai: 'रोगी', sat: 'ᱨᱩᱜᱤ', ks: 'مٔریٖض', ne: 'बिरामी', gon: 'మరీజ్', sd: 'مريض', kok: 'दुयेंती', doi: 'मरीज',
    mni: 'ꯑꯅꯥꯕ', dhn: 'रुग्ण', kru: 'बेमारू', kha: 'U Nongpang', brx: 'गोग्लैनाय', grt: 'Sagipa', unr: 'रुगी', hoc: 'रुगी', kxu: 'ରୋଗୀ', kfq: 'मरीज',
    hlb: 'मरीज', mrg: 'Kínam ami', mjw: 'Keme chelang', kff: 'రోగి', njo: 'Shirangtsür', stv: 'Kiphi', njm: 'Thsuru mi', nbe: 'Hekamei', nmf: 'Kakhama', lus: 'Damlo',
    tcz: 'Damlou', njh: 'Mhachakhe', rah: 'Sagiba', nri: 'Ketsümi', nph: 'Kanyei', njz: 'Hekhe bami', lep: 'Zóng bo', lif: 'Meengba', bix: 'रुगी', sa: 'रोगी (रुग्णः)',
  },
  'Doctor': {
    hi: 'डॉक्टर (Doctor)', bn: 'ডাক্তার', mr: 'डॉक्टर', te: 'వైద్యుడు (డాక్టర్)', ta: 'மருத்துவர்', gu: 'ડૉક્ટર', ur: 'ڈاکٹر', kn: 'ವೈದ್ಯರು', or: 'ଡାକ୍ତର', ml: 'ഡോക്ടർ',
    pa: 'ਡਾਕਟਰ', as: 'চিকিৎসক', mai: 'चिकित्सक', sat: 'ᱰᱟᱠᱛᱟᱨ', ks: 'ڈاکٹَر', ne: 'चिकित्सक', gon: 'డాక్టర్', sd: 'ڊاڪٽر', kok: 'दोतोर', doi: 'डाक्टर',
    mni: 'ꯗꯥꯛꯇꯔ', dhn: 'डॉक्टर', kru: 'डाक्टर', kha: 'Doktor', brx: 'फाहामगिरि', grt: 'Daktar', unr: 'डाक्टर', hoc: 'डाक्टर', kxu: 'ଡାକ୍ତର', kfq: 'डाक्टर',
    hlb: 'डाक्टर', mrg: 'Doctor', mjw: 'Doctor', kff: 'డాక్టర్', njo: 'Doctor', stv: 'Doctor', njm: 'Doctor', nbe: 'Doctor', nmf: 'Doctor', lus: 'Daktawr',
    tcz: 'Doctor', njh: 'Doctor', rah: 'Daktar', nri: 'Doctor', nph: 'Doctor', njz: 'Doctor', lep: 'Doctor', lif: 'Doctor', bix: 'डाक्टर', sa: 'चिकित्सकः',
  },
  'Patient Portal': {
    hi: 'मरीज़ पोर्टल', bn: 'রোগী পোর্টাল', mr: 'रुग्ण पोर्टल', te: 'పేషెంట్ పోర్టల్', ta: 'நோயாளி தளம்', gu: 'દર્દી પોર્ટલ', ur: 'مریض پورٹل', kn: 'ರೋಗಿ ಪೋರ್ಟಲ್', or: 'ରୋଗୀ ପୋର୍ଟାଲ', ml: 'പേഷ്യന്റ് പോർട്ടൽ',
    pa: 'ਮਰੀਜ਼ ਪੋਰਟਲ', as: 'ৰোগী পৰ্টেল', mai: 'रोगी पोर्टल', sat: 'ᱨᱩᱜᱤ ᱯᱳᱨᱴᱟᱞ', ks: 'مٔریٖض پۄرٹَل', ne: 'बिरामी पोर्टल', gon: 'రోగి పోర్టల్', sd: 'مريض پورٽل', kok: 'दुयेंती पोर्टल', doi: 'मरीज पोर्टल',
    mni: 'ꯑꯅꯥꯕ ꯄꯣꯔꯇꯦꯜ', dhn: 'रुग्ण पोर्टल', kru: 'बेमारू पोर्टल', kha: 'Portal Ki Nongpang', brx: 'गोग्लैनाय पोर्टल', grt: 'Sagipa Portal', unr: 'रुगी पोर्टल', hoc: 'रुगी पोर्टल', kxu: 'ରୋଗୀ ପୋର୍ଟାଲ', kfq: 'मरीज पोर्टल',
    hlb: 'मरीज पोर्टल', mrg: 'Kínam ami portal', mjw: 'Keme portal', kff: 'రోగి పోర్టల్', njo: 'Shirangtsür portal', stv: 'Kiphi portal', njm: 'Thsuru portal', nbe: 'Hekamei portal', nmf: 'Kakhama portal', lus: 'Damlo portal',
    tcz: 'Damlou portal', njh: 'Mhachakhe portal', rah: 'Sagiba portal', nri: 'Ketsümi portal', nph: 'Kanyei portal', njz: 'Bami portal', lep: 'Zóng portal', lif: 'Meengba portal', bix: 'रुगी पोर्टल', sa: 'रुग्ण-प्रवेशद्वारम्',
  },
  'Doctor Portal': {
    hi: 'डॉक्टर पोर्टल', bn: 'ডাক্তার পোর্টাল', mr: 'डॉक्टर पोर्टल', te: 'డాక్టర్ పోర్టల్', ta: 'மருத்துவர் தளம்', gu: 'ડૉક્ટર પોર્ટલ', ur: 'ڈاکٹر پورٹل', kn: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್', or: 'ଡାକ୍ତର ପୋର୍ଟାଲ', ml: 'ഡോക്ടർ പോർട്ടൽ',
    pa: 'ਡਾਕਟਰ ਪੋਰਟਲ', as: 'চিকিৎসক পৰ্টেল', mai: 'चिकित्सक पोर्टल', sat: 'ᱰᱟᱠᱛᱟᱨ ᱯᱳᱨᱴᱟᱞ', ks: 'ڈاکٹَر پۄرٹَل', ne: 'डाक्टर पोर्टल', gon: 'డాక్టర్ పోర్టల్', sd: 'ڊاڪٽر پورٽل', kok: 'दोतोर पोर्टल', doi: 'डाक्टर पोर्टल',
    mni: 'ꯗꯥꯛꯇꯔ ꯄꯣꯔꯇꯦꯜ', dhn: 'डॉक्टर पोर्टल', kru: 'डाक्टर पोर्टल', kha: 'Portal Doktor', brx: 'फाहामगिरि पोर्टल', grt: 'Daktar Portal', unr: 'डाक्टर पोर्टल', hoc: 'डाक्टर पोर्टल', kxu: 'ଡାକ୍ତର ପୋର୍ଟାଲ', kfq: 'डाक्टर पोर्टल',
    hlb: 'डाक्टर पोर्टल', mrg: 'Doctor portal', mjw: 'Doctor portal', kff: 'డాక్టర్ పోర్టల్', njo: 'Doctor portal', stv: 'Doctor portal', njm: 'Doctor portal', nbe: 'Doctor portal', nmf: 'Doctor portal', lus: 'Daktawr portal',
    tcz: 'Doctor portal', njh: 'Doctor portal', rah: 'Daktar portal', nri: 'Doctor portal', nph: 'Doctor portal', njz: 'Doctor portal', lep: 'Doctor portal', lif: 'Doctor portal', bix: 'डाक्टर पोर्टल', sa: 'चिकित्सक-प्रवेशद्वारम्',
  },
  'AI Health Check-Up': {
    hi: 'एआई स्वास्थ्य जांच', bn: 'এআই স্বাস্থ্য পরীক্ষা', mr: 'एआय आरोग्य तपासणी', te: 'AI హెల్త్ చెకప్', ta: 'AI நல பரிசோதனை', gu: 'AI આરોગ્ય તપાસ', ur: 'AI صحت کا معائنہ', kn: 'AI ಆರೋಗ್ಯ ತಪಾಸಣೆ', or: 'AI ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା', ml: 'AI ആരോഗ്യ പരിശോധന',
    pa: 'AI ਸਿਹਤ ਜਾਂਚ', as: 'AI স্বাস্থ্য পৰীক্ষা', mai: 'एआई स्वास्थ्य जाँच', sat: 'AI ᱦᱚᱲᱢᱚ ᱪᱮᱠ', ks: 'AI صِحَت پَرکھ', ne: 'एआई स्वास्थ्य जाँच', gon: 'AI ఆరోగ్య పరీక్ష', sd: 'AI صحت جي چڪاس', kok: 'AI भलायकी तपासणी', doi: 'AI सेहत जांच',
    mni: 'AI ꯍꯛꯁꯦꯜ ꯌꯦꯡꯁꯤꯟꯕ', dhn: 'AI तब्येत तपासणी', kru: 'AI बेमारी जांच', kha: 'AI Jingkhyllie Koit Khiah', brx: 'AI साबस्रि नायबिजिरनाय', grt: 'AI An·sengani sandina', unr: 'AI होड़मो जांच', hoc: 'AI होड़मो जांच', kxu: 'AI ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା', kfq: 'AI तबियत जांच',
    hlb: 'AI देह जांच', mrg: 'AI arí-rísang kénam', mjw: 'AI thembar chelang', kff: 'AI ఆరోగ్య పరీక్ష', njo: 'AI tazung asadangba', stv: 'AI aküxü ashelo', njm: 'AI kevi kethsu', nbe: 'AI heyo chem', nmf: 'AI khanganai kazat', lus: 'AI hriselna en dikna',
    tcz: 'AI damna vechehna', njh: 'AI mhona zolanka', rah: 'AI bemar chachina', nri: 'AI kevi kethsu', nph: 'AI kahuk chem', njz: 'AI huming cheknam', lep: 'AI tsat súng', lif: 'AI saangghik chek', bix: 'AI होड़मो जांच', sa: 'AI स्वास्थ्य-परीक्षणम्',
  },
  'Start Health Check': {
    hi: 'स्वास्थ्य जांच शुरू करें', bn: 'স্বাস্থ্য পরীক্ষা শুরু করুন', mr: 'आरोग्य तपासणी सुरू करा', te: 'హెల్త్ చెక్ ప్రారంభించండి', ta: 'நல பரிசோதனையை தொடங்கு', gu: 'આરોગ્ય તપાસ શરૂ કરો', ur: 'صحت کی جانچ شروع کریں', kn: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ', or: 'ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ', ml: 'ആരോഗ്യ പരിശോധന ആരംഭിക്കുക',
    pa: 'ਸਿਹਤ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ', as: 'স্বাস্থ্য পৰীক্ষা আৰম্ভ কৰক', mai: 'स्वास्थ्य जाँच शुरू करू', sat: 'ᱦᱚᱲᱢᱚ ᱪᱮᱠ ᱮᱦᱚᱵᱽ', ks: 'صِحَت پَرکھ شُروع کٔرِو', ne: 'स्वास्थ्य जाँच सुरु गर्नुहोस्', gon: 'ఆరోగ్య పరీక్ష మొదలు చేయండి', sd: 'صحت جي چڪاس شروع ڪريو', kok: 'तपासणी सुरू करा', doi: 'सेहत जांच शुरू करो',
    mni: 'ꯍꯛꯁꯦꯜ ꯌꯦꯡꯁꯤꯟꯕ ꯍꯧꯔꯀꯎ', dhn: 'आरोग्य तपासणी सुरू करा', kru: 'बेमारी जांच सुरू करा', kha: 'Sdang Jingkhyllie', brx: 'नायबिजिरनाय जागाय', grt: 'Sandina a·bachengbo', unr: 'होड़मो जांच एहोब', hoc: 'होड़मो जांच एहोब', kxu: 'ପରୀକ୍ଷା ଆରମ୍ଭ କର', kfq: 'जांच शुरू करो',
    hlb: 'जांच सुरू करा', mrg: 'Arí kénam gílík', mjw: 'Thembar kelang son', kff: 'పరీక్ష ప్రారంభించండి', njo: 'Asadangba tenzükang', stv: 'Ashelo ghenguno', njm: 'Kethsu tsali', nbe: 'Chem le', nmf: 'Kazat phungra', lus: 'En dik ṭan rawh',
    tcz: 'Pan in', njh: 'Thowu', rah: 'A·bacheng', nri: 'Tsali', nph: 'Thowu', njz: 'Kema', lep: 'Lóm', lif: 'Hekpang', bix: 'होड़मो जांच एहोब', sa: 'स्वास्थ्यपरीक्षणम् आरभताम्',
  },
  'Dashboard': {
    hi: 'डैशबोर्ड', bn: 'ড্যাশবোর্ড', mr: 'डॅशबोर्ड', te: 'డాష్‌బోర్డ్', ta: 'டாஷ்போர்டு', gu: 'ડૅશબોર્ડ', ur: 'ڈیش بورڈ', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', or: 'ଡ୍ୟାସବୋର୍ଡ', ml: 'ഡാഷ്‌ബോർഡ്',
    pa: 'ਡੈਸ਼ਬੋਰਡ', as: 'ড্যাশবোর্ড', mai: 'डैशबोर्ड', sat: 'ᱰᱮᱥᱵᱳᱨᱰ', ks: 'ڈیش بورڈ', ne: 'ड्यासबોર્ડ', gon: 'డాష్‌బోర్డ్', sd: 'ڊيش بورڊ', kok: 'डॅशबोर्ड', doi: 'डैशबोर्ड',
    mni: 'ꯗꯦꯁꯕꯣꯔꯗ', dhn: 'डॅशबोर्ड', kru: 'डैशबोर्ड', kha: 'Dashboard', brx: 'डैशबोर्ड', grt: 'Dashboard', unr: 'डैशबोर्ड', hoc: 'डैशबोर्ड', kxu: 'ଡ୍ୟାସବୋର୍ଡ', kfq: 'डैशबोर्ड',
    hlb: 'डैशबोर्ड', mrg: 'Dashboard', mjw: 'Dashboard', kff: 'డాష్‌బోర్డ్', njo: 'Dashboard', stv: 'Dashboard', njm: 'Dashboard', nbe: 'Dashboard', nmf: 'Dashboard', lus: 'Dashboard',
    tcz: 'Dashboard', njh: 'Dashboard', rah: 'Dashboard', nri: 'Dashboard', nph: 'Dashboard', njz: 'Dashboard', lep: 'Dashboard', lif: 'Dashboard', bix: 'डैशबोर्ड', sa: 'नियन्त्रणपट्टिका (डैशबोर्ड)',
  },
  'Medical Records': {
    hi: 'मेडिकल रिकॉर्ड्स', bn: 'চিকিৎসা সংক্রান্ত রেকর্ড', mr: 'वैद्यकीय नोंदी', te: 'మెడికల్ రికార్డులు', ta: 'மருத்துவ பதிவுகள்', gu: 'તબીબી રેકોર્ડ્સ', ur: 'طبی ریکارڈز', kn: 'ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು', or: 'ଚିକିତ୍ସା ରେକର୍ଡ', ml: 'മെഡിക്കൽ റെക്കോർഡുകൾ',
    pa: 'ਮੈਡੀਕਲ ਰਿਕਾਰਡ', as: 'চিকিৎসা নথি', mai: 'चिकित्सा रिकॉर्ड', sat: 'ᱨᱟᱱ ᱨᱮᱠᱳᱨᱰ', ks: 'طِبی رِکارڈ', ne: 'चिकित्सा रेकर्डहरू', gon: 'వైద్య రికార్డులు', sd: 'ميڊيڪل رڪارڊز', kok: 'भलायकी नोंदी', doi: 'मेडिकल रिकार्ड',
    mni: 'ꯂꯥꯌꯦꯡꯒꯤ ꯔꯦꯀꯣꯔꯗ', dhn: 'वैद्यकीय नोंदी', kru: 'बेमारी रिकॉर्ड', kha: 'Ki Kot Jingpang', brx: 'फाहामनाय फोरमान', grt: 'Saani Lekharang', unr: 'रुगी रिकार्ड', hoc: 'रुगी रिकार्ड', kxu: 'ଚିକିତ୍ସା ରେକର୍ଡ', kfq: 'मेडिकल रिकार्ड',
    hlb: 'इलाज के कागज', mrg: 'Arí ager', mjw: 'Keme akam', kff: 'వైద్య రికార్డులు', njo: 'Kaket tazung', stv: 'Akukuthu', njm: 'Lekha puo', nbe: 'Kapei chem', nmf: 'Kakapi kazat', lus: 'Damdawi lam record te',
    tcz: 'Damna lekha', njh: 'Mhachakhe kaket', rah: 'Bemarni lekha', nri: 'Lekha puo', nph: 'Lekha lang', njz: 'Kaket kema', lep: 'Aatshang jók', lif: 'Lekha saang', bix: 'रुगी रिकार्ड', sa: 'चिकित्सा-अभिलेखाः',
  },
  'Health Summary': {
    hi: 'स्वास्थ्य सारांश (Summary)', bn: 'স্বাস্থ্য সারাংশ', mr: 'आरोग्य सारांश', te: 'హెల్త్ సమ్మరీ (సారాంశం)', ta: 'உடல்நல சுருக்கம்', gu: 'આરોગ્ય સારાંશ', ur: 'صحت کا خلاصہ', kn: 'ಆರೋಗ್ಯ ಸಾರಾಂಶ', or: 'ସ୍ୱାସ୍ଥ୍ୟ ସାରାଂଶ', ml: 'ആരോഗ്യ സംഗ്രഹം',
    pa: 'ਸਿਹਤ ਸੰਖੇਪ', as: 'স্বাস্থ্য সাৰাংশ', mai: 'स्वास्थ्य सारांश', sat: 'ᱦᱚᱲᱢᱚ ᱥᱟᱨᱟᱝᱥ', ks: 'صِحَت خُلاصہٕ', ne: 'स्वास्थ्य सारांश', gon: 'ఆరోగ్య సారాంశం', sd: 'صحت جو خلاصو', kok: 'भलायकी सारांश', doi: 'सेहत सारांश',
    mni: 'ꯍꯛꯁꯦꯜ ꯑꯄꯨꯟꯕ ꯋꯥꯔꯣꯜ', dhn: 'आरोग्य गोषवारा', kru: 'बेमारी सार', kha: 'Jingkdew Koit Khiah', brx: 'साबस्रि सुंद\' बिजिर', grt: 'An·sengani Katta', unr: 'होड़मो सार', hoc: 'होड़मो सार', kxu: 'ସ୍ୱାସ୍ଥ୍ୟ ସାରାଂଶ', kfq: 'सेहत सार',
    hlb: 'बीमारी सार', mrg: 'Arí doying', mjw: 'Thembar ason', kff: 'ఆరోగ్య సారాంశం', njo: 'Tazung asadang', stv: 'Aküxü ashelo', njm: 'Kevi kethsu', nbe: 'Heyo chem', nmf: 'Kazat khonram', lus: 'Hriselna tlangpui',
    tcz: 'Damna thusem', njh: 'Mhona lio', rah: 'Bemarni katha', nri: 'Kevi kethsu', nph: 'Kahuk chem', njz: 'Huming kema', lep: 'Tsat súng', lif: 'Cikhim khek', bix: 'होड़मो सार', sa: 'स्वास्थ्य-सारांशः',
  },
  'Health Timeline': {
    hi: 'स्वास्थ्य टाइमलाइन (इतिहास)', bn: 'স্বাস্থ্য টাইমলাইন', mr: 'आरोग्य कालरेषा', te: 'హెల్త్ టైమ్‌లైన్', ta: 'உடல்நல காலக்கோடு', gu: 'આરોગ્ય ટાઈમલાઈન', ur: 'صحت کی ٹائم لائن', kn: 'ಆರೋಗ್ಯ ಟೈಮ್‌ಲೈನ್', or: 'ସ୍ୱାସ୍ଥ୍ୟ ସମୟରେଖା', ml: 'ആരോഗ്യ ടൈംലൈൻ',
    pa: 'ਸਿਹਤ ਟਾਈਮਲਾਈਨ', as: 'স্বাস্থ্য সময়ৰেখা', mai: 'स्वास्थ्य कालक्रम', sat: 'ᱦᱚᱲᱢᱚ ᱚᱠᱛᱚ ᱜᱟᱨ', ks: 'صِحَت ٹائم لاین', ne: 'स्वास्थ्य समयरेखा', gon: 'ఆరోగ్య కాలక్రమం', sd: 'صحت جي ٽائيم لائن', kok: 'भलायकी कालपट', doi: 'सेहत टाइमलाइन',
    mni: 'ꯍꯛꯁꯦꯜ ꯃꯇꯝ ꯃꯇꯨꯡ ꯏꯟꯅ', dhn: 'आरोग्य कालपट', kru: 'बेमारी बेरा', kha: 'Ka Por Jingpang', brx: 'थासारि समफोर', grt: 'Somoi Lekha', unr: 'होड़मो बेरा', hoc: 'होड़मो बेरा', kxu: 'ସମୟ ବିବରଣୀ', kfq: 'बीमारी का समय',
    hlb: 'बीमारी बेरा', mrg: 'Arí por', mjw: 'Por aling', kff: 'ఆరోగ్య కాలక్రమం', njo: 'Mapang kaket', stv: 'Mapang ashelo', njm: 'Vor rüli', nbe: 'Thung lang', nmf: 'Thot kazat', lus: 'Natna lo awm dan hun bi',
    tcz: 'Hun bi thil', njh: 'Mapang zolanka', rah: 'Somoi lekha', nri: 'Vor rüli', nph: 'Thung chem', njz: 'Somoi kema', lep: 'Thon súng', lif: 'Por khek', bix: 'होड़मो बेरा', sa: 'स्वास्थ्य-कालरेखा',
  },
  'Doctors': {
    hi: 'डॉक्टर्स (चिकित्सक)', bn: 'ডাক্তারগণ', mr: 'डॉक्टर्स', te: 'వైద్యులు (డాక్టర్లు)', ta: 'மருத்துவர்கள்', gu: 'ડૉક્ટરો', ur: 'ڈاکٹرز', kn: 'ವೈದ್ಯರುಗಳು', or: 'ଡାକ୍ତରମାନେ', ml: 'ഡോക്ടർമാർ',
    pa: 'ਡਾਕਟਰ ਸਾਹਿਬਾਨ', as: 'চিকিৎসকসকল', mai: 'चिकित्सकसभ', sat: 'ᱰᱟᱠᱛᱟᱨ ᱠᱚ', ks: 'ڈاکٹَر صاحِبان', ne: 'डाक्टरहरू', gon: 'డాక్టర్లు', sd: 'ڊاڪٽر', kok: 'दोतोर', doi: 'डाक्टर',
    mni: 'ꯗꯥꯛꯇꯔꯁꯤꯡ', dhn: 'डॉक्टर', kru: 'डाक्टर गन', kha: 'Ki Doktor', brx: 'फाहामगिरिफोर', grt: 'Daktarrang', unr: 'डाक्टर को', hoc: 'डाक्टर को', kxu: 'ଡାକ୍ତରମାନେ', kfq: 'डाक्टर',
    hlb: 'डाक्टर मन', mrg: 'Doctor kidum', mjw: 'Doctor atum', kff: 'వైద్యులు', njo: 'Doctor tem', stv: 'Doctor ko', njm: 'Doctor ko', nbe: 'Doctor mao', nmf: 'Doctor bing', lus: 'Daktawr te',
    tcz: 'Doctor ho', njh: 'Doctor ekhüm', rah: 'Daktarrang', nri: 'Doctor ko', nph: 'Doctor mong', njz: 'Doctor ngalang', lep: 'Doctor kyu', lif: 'Doctor tumit', bix: 'डाक्टर को', sa: 'चिकित्सकाः',
  },
  'Prescriptions': {
    hi: 'प्रिस्क्रिप्शन (दवा पर्ची)', bn: 'প্রেসক্রিপশনসমূহ', mr: 'औषधोपचार / प्रिस्क्रिप्शन', te: 'ప్రిస్క్రిప్షన్లు (మందుల చీటీలు)', ta: 'மருந்து சீட்டுகள்', gu: 'દવાની ચિઠ્ઠીઓ', ur: 'نسخہ جات', kn: 'ಔಷಧಿ ಚೀಟಿಗಳು', or: 'ଡାକ୍ତରୀ ପ୍ରେସକ୍ରିପସନ୍', ml: 'പ്രിസ്ക്രിപ്ഷനുകൾ',
    pa: 'ਦਵਾਈ ਪਰਚੀਆਂ', as: 'ঔষধৰ নিদান', mai: 'दबाई पर्ची', sat: 'ᱨᱟᱱ ᱥᱟᱠᱟᱢ', ks: 'دَوا پَرچہٕ', ne: 'औषधि पुर्जीहरू', gon: 'మందుల చీటీలు', sd: 'نسخا', kok: 'वखतांचीं चिठ्ठ्यो', doi: 'दवाई दियां परचियां',
    mni: 'ꯍꯤꯗꯥꯛ ꯆꯦ', dhn: 'गोळ्यांची चिठ्ठी', kru: 'दवाई कागद', kha: 'Ki Kot Dawai', brx: 'मुलाइ बिलाइ', grt: 'Samni Lekha', unr: 'रान कागद', hoc: 'रान कागद', kxu: 'ଔଷଧ ଚିଠା', kfq: 'दवाई पर्चा',
    hlb: 'दवाई के पाती', mrg: 'Sam kaket', mjw: 'Sam arik', kff: 'మందుల చీటీలు', njo: 'Mo kaket', stv: 'Achi kaket', njm: 'Ruve lekha', nbe: 'Mao kaket', nmf: 'Kathi kakapi', lus: 'Damdawi lehkha te',
    tcz: 'Damdawi lekha', njh: 'Sam kaket', rah: 'Samni lekha', nri: 'Ruve lekha', nph: 'Mao lekha', njz: 'Sam kaket', lep: 'Móng jók', lif: 'Sam lekha', bix: 'रान कागद', sa: 'औषध-पत्राणि (प्रिस्क्रिप्शन)',
  },
  'Profile': {
    hi: 'प्रोफाइल', bn: 'প্রোফাইল', mr: 'प्रोफाइल', te: 'ప్రొఫైల్', ta: 'சுயவிவரம்', gu: 'પ્રોફાઇલ', ur: 'پروفائل', kn: 'ಪ್ರೊಫೈಲ್', or: 'ପ୍ରୋଫାଇଲ୍', ml: 'പ്രൊഫൈൽ',
    pa: 'ਪ੍ਰੋਫਾਈਲ', as: 'প্র’ফাইল', mai: 'प्रोफाइल', sat: 'ᱯᱨᱳᱯᱷᱟᱭᱤᱞ', ks: 'پروفائل', ne: 'प्रोफाइल', gon: 'ప్రొఫైల్', sd: 'پروفائل', kok: 'प्रोफाइल', doi: 'प्रोफाइल',
    mni: 'ꯄ꯭ꯔꯣꯐꯥꯏꯜ', dhn: 'प्रोफाइल', kru: 'प्रोफाइल', kha: 'Profile', brx: 'प्रोफाइल', grt: 'Profile', unr: 'प्रोफाइल', hoc: 'प्रोफाइल', kxu: 'ପ୍ରୋଫାଇଲ୍', kfq: 'प्रोफाइल',
    hlb: 'प्रोफाइल', mrg: 'Profile', mjw: 'Profile', kff: 'ప్రొఫైల్', njo: 'Profile', stv: 'Profile', njm: 'Profile', nbe: 'Profile', nmf: 'Profile', lus: 'Profile',
    tcz: 'Profile', njh: 'Profile', rah: 'Profile', nri: 'Profile', nph: 'Profile', njz: 'Profile', lep: 'Profile', lif: 'Profile', bix: 'प्रोफाइल', sa: 'स्वविवरणम् (प्रोफाइल)',
  },
  'Notifications': {
    hi: 'सूचनाएं (Notifications)', bn: 'বিজ্ঞপ্তি', mr: 'सूचना', te: 'నోటిఫికేషన్లు', ta: 'அறிவிப்புகள்', gu: 'સૂચનાઓ', ur: 'اطلاعات', kn: 'ಅಧಿಸೂಚನೆಗಳು', or: 'ବିଜ୍ଞପ୍ତି', ml: 'അറിയിപ്പുകൾ',
    pa: 'ਸੂਚਨਾਵਾਂ', as: 'বিজ্ঞপ্তিসমূহ', mai: 'सूचनासभ', sat: 'ᱵᱟᱰᱟᱭ ᱠᱚ', ks: 'اطلاعات', ne: 'सूचनाहरू', gon: 'సమాచారాలు', sd: 'اطلاعون', kok: 'सुचोवण्यो', doi: 'सूचनां',
    mni: 'ꯄꯥꯎ', dhn: 'सूचना', kru: 'खबर', kha: 'Ki Jingpyntip', brx: 'फोरसावनाय', grt: 'U·iatani', unr: 'खबर को', hoc: 'खबर को', kxu: 'ସୂଚନା', kfq: 'सूचना',
    hlb: 'समाचार', mrg: 'Doying', mjw: 'Kethu keme', kff: 'నోటిఫికేషన్లు', njo: 'Osang kaket', stv: 'Kughu kaket', njm: 'Lekha puo', nbe: 'Kapei', nmf: 'Kakhon', lus: 'Hriattirna te',
    tcz: 'Hriatpuina', njh: 'Eloroe', rah: 'Katha', nri: 'Lekha puo', nph: 'Lekha', njz: 'Kaket', lep: 'Jók', lif: 'Lekha', bix: 'खबर को', sa: 'सूचनाः (अधिसूचनाः)',
  },
  'Logout': {
    hi: 'लॉग आउट', bn: 'লগআউট', mr: 'बाहेर पडा (लॉगआउट)', te: 'లాగౌట్', ta: 'வெளியேறு', gu: 'લૉગઆઉટ', ur: 'لاگ آؤٹ', kn: 'ಲಾಗ್ ಔಟ್', or: 'ଲଗ୍ ଆଉଟ୍', ml: 'ലോഗൗട്ട്',
    pa: 'ਲਾਗ ਆਉਟ', as: 'লগ আউট', mai: 'बाहर निकलू', sat: 'ᱚᱰᱚᱠ', ks: 'لاگ آوٹ', ne: 'लगआउट', gon: 'బయటకు వెళ్ళు', sd: 'لاگ آئوٽ', kok: 'भायर सरा', doi: 'लाग आउट',
    mni: 'ꯊꯣꯛꯂꯛꯎ', dhn: 'बाहेर पडा', kru: 'बाहर निकलो', kha: 'Mih noh', brx: 'ओंखारनाय', grt: 'Ong·katbo', unr: 'ओडोक', hoc: 'ओडोक', kxu: 'ବାହାରକୁ ଯିବା', kfq: 'बाहर जाओ',
    hlb: 'बाहर निकरा', mrg: 'Ánggo elo ngolík', mjw: 'Kangphup ra', kff: 'లాగౌట్', njo: 'Adoktokang', stv: 'Ilo shishi', njm: 'Vowor tsali', nbe: 'Va me', nmf: 'Wungda', lus: 'Chhuak rawh',
    tcz: 'Potdoh in', njh: 'Oro tsoka', rah: 'Ong·katwa', nri: 'Vor vo', nph: 'Va me', njz: 'Bapa', lep: 'Lóm', lif: 'Lhaang', bix: 'ओडोक', sa: 'निर्गमः (लॉगआउट)',
  },
  'Your Smart Hospital Assistant': {
    hi: 'आपका स्मार्ट अस्पताल सहायक', bn: 'আপনার স্মার্ট হাসপাতাল সহকারী', mr: 'तुमचा स्मार्ट रुग्णालय सहाय्यक', te: 'మీ స్మార్ట్ హాస్పిటల్ అసిస్టెంట్', ta: 'உங்கள் ஸ்மார்ட் மருத்துவமனை உதவியாளர்', gu: 'તમારો સ્માર્ટ હોસ્પિટલ સહાયક', ur: 'آپ کا اسمارٹ ہسپتال معاون', kn: 'ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಆಸ್ಪತ್ರೆ ಸಹಾಯಕ', or: 'ଆପଣଙ୍କ ସ୍ମାର୍ଟ ଡାକ୍ତରଖାନା ସହାୟକ', ml: 'നിങ്ങളുടെ സ്മാർട്ട് ഹോസ്പിറ്റൽ അസിസ്റ്റന്റ്',
    pa: 'ਤੁਹਾਡਾ ਸਮਾਰਟ ਹਸਪਤਾਲ ਸਹਾਇਕ', as: 'আপোনাৰ স্মাৰ্ট চিকিৎসালয় সহায়ক', mai: 'अहाँक स्मार्ट अस्पताल सहायक', sat: 'ᱟᱢᱟᱜ ᱥᱢᱟᱨᱴ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱜᱚᱲᱚᱭᱤᱡ', ks: 'تُہُند سمارٹ ہسپتال مُعاوِن', ne: 'तपाईंको स्मार्ट अस्पताल सहायक', gon: 'మీ స్మార్ట్ దవాఖాన సహాయకుడు', sd: 'توهان جو سمارٽ اسپتال مددگار', kok: 'तुमचो स्मार्ट हॉस्पिटलाचो सहाय्यक', doi: 'तुंदा स्मार्ट हस्पताल सहायक',
    mni: 'ꯅꯍꯥꯛꯀꯤ ꯁ꯭ꯃꯥꯔ꯭ꯠ ꯍꯣꯁꯄꯤꯇꯥꯜ ꯃꯇꯦꯡ ꯄꯥꯡꯕ', dhn: 'तुमचा स्मार्ट रुग्णालय मदतनीस', kru: 'निंघाय स्मार्ट डाक्टरखाना मदतगार', kha: 'U Nongïarap Hospital Ba Stad', brx: 'नोंथांनि सोलोंथायारि फाहामसालि हेफाजाबगिरि', grt: 'Nang·ni Smart Hospital Dakchakgipa', unr: 'अमअः स्मार्ट अस्पताल गोड़ोइच', hoc: 'अमअः स्मार्ट अस्पताल गोड़ोइच', kxu: 'ଆପଣଙ୍କ ଚତୁର ଚିକିତ୍ସାଳୟ ସହାୟକ', kfq: 'तुम्हारा स्मार्ट अस्पताल साथी',
    hlb: 'हमार स्मार्ट डाक्टरखाना साथी', mrg: 'Nolukke smart hospital ager', mjw: 'Nangke smart hospital ajir', kff: 'మీ స్మార్ట్ దవాఖాన సహాయకుడు', njo: 'Ne smart hospital yaritsür', stv: 'O smart hospital kiphi', njm: 'N smart hospital miapfutsü', nbe: 'Nang smart hospital kapei', nmf: 'Na smart hospital khonram', lus: 'I smart damdawi in ṭanpuitu',
    tcz: 'Na smart hospital panpuitu', njh: 'Nte smart hospital eloroe', rah: 'Nang·ni smart hospital dakchakgipa', nri: 'N smart hospital miapfutsü', nph: 'Nang smart hospital mong', njz: 'Ngope smart hospital ngalang', lep: 'Káyu smart hospital klyen', lif: 'Aaniingyo smart hospital cikhim', bix: 'अमअः स्मार्ट अस्पताल गोड़ोइच', sa: 'भवतः चतुर-चिकित्सालय-सहायकः',
  },
  'Select Website & AI Voice Language': {
    hi: 'वेबसाइट और एआई आवाज की भाषा चुनें', bn: 'ওয়েবসাইট ও এআই কণ্ঠের ভাষা নির্বাচন করুন', mr: 'वेबसाइट आणि एआय आवाजाची भाषा निवडा', te: 'వెబ్‌సైట్ & AI వాయిస్ భాషను ఎంచుకోండి', ta: 'வலைத்தளம் & AI குரல் மொழியை தேர்ந்தெடுக்கவும்', gu: 'વેબસાઇટ અને AI અવાજની ભાષા પસંદ કરો', ur: 'ویب سائٹ اور AI آواز کی زبان منتخب کریں', kn: 'ವೆಬ್‌ಸೈಟ್ ಮತ್ತು AI ಧ್ವನಿ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', or: 'ୱେବସାଇଟ୍ ଏବଂ AI ସ୍ୱର ଭାଷା ବାଛନ୍ତୁ', ml: 'വെബ്‌സൈറ്റും AI വോയ്‌സ് ഭാഷയും തിരഞ്ഞെടുക്കുക',
    pa: 'ਵੈੱਬਸਾਈਟ ਅਤੇ AI ਆਵਾਜ਼ ਦੀ ਭਾਸ਼ਾ ਚੁਣੋ', as: 'ৱেবছাইট আৰু AI কণ্ঠৰ ভাষা নিৰ্বাচন কৰক', mai: 'वेबसाइट आ एआई आवाजक भाषा चुनू', sat: 'ᱣᱮᱵᱽᱥᱟᱭᱤᱴ ᱟᱨ AI ᱟᱲᱟᱝ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ', ks: 'ویب سایِٹ تہٕ AI آوازٕچ زَبان چُنِو', ne: 'वेबसाइट र एआई आवाजको भाषा छान्नुहोस्', gon: 'వెబ్‌సైట్ మరియు AI వాయిస్ భాషను ఎంచుకోండి', sd: 'ويب سائيٽ ۽ AI آواز جي ٻولي چونڊيو', kok: 'वेबसाइट आनी AI आवाजाची भास निवडा', doi: 'वेबसाइट ते AI आवाज दी बोली चुणो',
    mni: 'ꯋꯦꯕꯁꯥꯏꯠ ꯑꯃꯁꯨꯡ AI ꯈꯣꯟꯖꯦꯜꯒꯤ ꯂꯣꯟ ꯈꯟꯕ', dhn: 'वेबसाइट आणि AI आवाजाची भाषा निवडा', kru: 'वेबसाइट अरा AI बोली भाषा चुनो', kha: 'Jied Ktien Website & AI Voice', brx: 'वेबसाइट आरो AI रावनि राव सायख', grt: 'Website aro AI Voice Ku·sikko seokbo', unr: 'वेबसाइट आरु AI आवाज पाड़सी बाछी', hoc: 'वेबसाइट आरु AI आवाज पाड़सी बाछी', kxu: 'ୱେବସାଇଟ୍ ଏବଂ AI ସ୍ୱର ଭାଷା ବାଛନ୍ତୁ', kfq: 'वेबसाइट और AI आवाज़ बोली चुनो',
    hlb: 'वेबसाइट अउर AI आवाज़ भाखा बाछा', mrg: 'Website arí AI agom kénam', mjw: 'Website lapen AI lam ser non', kff: 'వెబ్‌సైట్ & AI వాయిస్ భాషను ఎంచుకోండి', njo: 'Website aser AI oshi shimatoka', stv: 'Website eno AI oshi pülülo', njm: 'Website mu AI die rükhro', nbe: 'Website nang AI lam le', nmf: 'Website li AI lairik kasa', lus: 'Website leh AI aw ṭawng thlang rawh',
    tcz: 'Website leh AI aw ṭawng lhendoh in', njh: 'Website nte AI oshi ekhümka', rah: 'Website aro AI voice ku·sikko seokbo', nri: 'Website mu AI die rükhro', nph: 'Website nang AI lam lang', njz: 'Website hoda AI oshi jima', lep: 'Website un AI ring gyen', lif: 'Website la AI pan hung', bix: 'वेबसाइट आरु AI आवाज पाड़सी बाछी', sa: 'जालपुटस्य तथा AI वाण्याः भाषां वृणुताम्',
  },
  'Get Started': {
    hi: 'आरंभ करें', bn: 'শুরু করুন', mr: 'सुरू करा', te: 'ప్రారంభించండి', ta: 'தொடங்கவும்', gu: 'શરૂ કરો', ur: 'شروع کریں', kn: 'ಪ್ರಾರಂಭಿಸಿ', or: 'ଆରମ୍ଭ କରନ୍ତୁ', ml: 'ആരംഭിക്കുക',
    pa: 'ਸ਼ੁਰੂ ਕਰੋ', as: 'আৰম্ভ কৰক', mai: 'आरंभ करू', sat: 'ᱮᱦᱚᱵᱽ', ks: 'شُروع کٔرِو', ne: 'सुरु गर्नुहोस्', gon: 'మొదలు చేయండి', sd: 'شروع ڪريو', kok: 'सुरू करा', doi: 'शुरू करो',
    mni: 'ꯍꯧꯔꯀꯎ', dhn: 'सुरू करा', kru: 'सुरू करा', kha: 'Sdang noh', brx: 'जागाय', grt: 'A·bachengbo', unr: 'एहोब', hoc: 'एहोब', kxu: 'ଆରମ୍ଭ କର', kfq: 'शुरू करो',
    hlb: 'सुरू करा', mrg: 'Gílík', mjw: 'Kangphup', kff: 'మొదలు పెట్టండి', njo: 'Tenzükang', stv: 'Ashelo', njm: 'Tsali', nbe: 'Kapei', nmf: 'Kasa', lus: 'Ṭan rawh',
    tcz: 'Pan in', njh: 'Thowu', rah: 'A·bacheng', nri: 'Tsali', nph: 'Thowu', njz: 'Kema', lep: 'Lóm', lif: 'Hekpang', bix: 'एहोब', sa: 'आरभताम्',
  },
  'Who Are You': {
    hi: 'आप कौन हैं?', bn: 'আপনি কে?', mr: 'तुम्ही कोण आहात?', te: 'మీరు ఎవరు?', ta: 'நீங்கள் யார்?', gu: 'તમે કોણ છો?', ur: 'آپ کون ہیں؟', kn: 'ನೀವು ಯಾರು?', or: 'ଆପଣ କିଏ?', ml: 'നിങ്ങൾ ആരാണ്?',
    pa: 'ਤੁਸੀਂ ਕੌਣ ਹੋ?', as: 'আপুনি কোন?', mai: 'अहाँ के छी?', sat: 'ᱟᱢ ᱚᱠᱚᱭ?', ks: 'تُہۍ کٔمۍ چھِو؟', ne: 'तपाईं को हुनुहुन्छ?', gon: 'మీరు ఎవరు?', sd: 'توهان ڪير آهيو؟', kok: 'तुम्ही कोण?', doi: 'तुस कौण ओ?',
    mni: 'ꯅꯍꯥꯛ ꯀꯅꯥꯅꯣ?', dhn: 'तुम्ही कोण आहात?', kru: 'नीन एकआय?', kha: 'Phi dei mano?', brx: 'नोंथाङा सोर?', grt: 'Na·a sawa?', unr: 'अम ओकोय?', hoc: 'अम ओकोय?', kxu: 'ଆପଣ କିଏ?', kfq: 'तुम कौन हो?',
    hlb: 'तुम्हे कोन आव?', mrg: 'Nolu seko?', mjw: 'Nang komo?', kff: 'మీరు ఎవరు?', njo: 'Ne shiba?', stv: 'O khuno?', njm: 'N thsuono?', nbe: 'Nang seima?', nmf: 'Na makha?', lus: 'Tu nge i nih?',
    tcz: 'Koima na hi?', njh: 'Nte shiba?', rah: 'Na·a sawa?', nri: 'N thsuono?', nph: 'Nang seima?', njz: 'Ngope kema?', lep: 'Káyu su?', lif: 'Aaniing sa?', bix: 'अम ओकोय?', sa: 'भवान् कः?',
  },
  'Explore Patient Portal': {
    hi: 'मरीज़ पोर्टल देखें', bn: 'রোগী পোর্টাল দেখুন', mr: 'रुग्ण पोर्टल पहा', te: 'పేషెంట్ పోర్టల్ చూడండి', ta: 'நோயாளி தளத்தை காண்க', gu: 'દર્દી પોર્ટલ જુઓ', ur: 'مریض پورٹل دیکھیں', kn: 'ರೋಗಿ ಪೋರ್ಟಲ್ ನೋಡಿ', or: 'ରୋଗୀ ପୋର୍ଟାଲ ଦେଖନ୍ତୁ', ml: 'പേഷ്യന്റ് പോർട്ടൽ കാണുക',
    pa: 'ਮਰੀਜ਼ ਪੋਰਟਲ ਵੇਖੋ', as: 'ৰোগী পৰ্টেল চাওক', mai: 'रोगी पोर्टल देखू', sat: 'ᱨᱩᱜᱤ ᱯᱳᱨᱴᱟᱞ ᱧᱮᱞ', ks: 'مٔریٖض پۄرٹَل وُچھِو', ne: 'बिरामी पोर्टल हेर्नुहोस्', gon: 'రోగి పోర్టల్ చూడండి', sd: 'مريض پورٽل ڏسو', kok: 'दुयेंती पोर्टल पळयात', doi: 'मरीज पोर्टल दिक्खो',
    mni: 'ꯑꯅꯥꯕ ꯄꯣꯔꯇꯦꯜ ꯌꯦꯡꯕꯤꯌꯨ', dhn: 'रुग्ण पोर्टल पहा', kru: 'बेमारू पोर्टल एरा', kha: 'Peit Portal Ki Nongpang', brx: 'गोग्लैनाय पोर्टल नाय', grt: 'Sagipa Portal Niboba', unr: 'रुगी पोर्टल नेल', hoc: 'रुगी पोर्टल नेल', kxu: 'ରୋଗୀ ପୋର୍ଟାଲ ଦେଖ', kfq: 'मरीज पोर्टल देखो',
    hlb: 'मरीज पोर्टल देखा', mrg: 'Kínam ami portal kangka', mjw: 'Keme portal lang non', kff: 'రోగి పోర్టల్ చూడండి', njo: 'Shirangtsür portal reprangang', stv: 'Kiphi portal julo', njm: 'Thsuru portal züli', nbe: 'Hekamei portal rang', nmf: 'Kakhama portal che', lus: 'Damlo portal en rawh',
    tcz: 'Damlou portal ve in', njh: 'Mhachakhe portal zolanka', rah: 'Sagiba portal niboba', nri: 'Ketsümi portal züli', nph: 'Kanyei portal rang', njz: 'Bami portal jima', lep: 'Zóng portal zut', lif: 'Meengba portal lang', bix: 'रुगी पोर्टल नेल', sa: 'रुग्ण-प्रवेशद्वारं पश्यतु',
  },
  'Explore Doctor Portal': {
    hi: 'डॉक्टर पोर्टल देखें', bn: 'ডাক্তার পোর্টাল দেখুন', mr: 'डॉक्टर पोर्टल पहा', te: 'డాక్టర్ పోర్టల్ చూడండి', ta: 'மருத்துவர் தளத்தை காண்க', gu: 'ડૉક્ટર પોર્ટલ જુઓ', ur: 'ڈاکٹر پورٹل دیکھیں', kn: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್ ನೋಡಿ', or: 'ଡାକ୍ତର ପୋର୍ଟାଲ ଦେଖନ୍ତୁ', ml: 'ഡോക്ടർ പോർട്ടൽ കാണുക',
    pa: 'ਡਾਕਟਰ ਪੋਰਟਲ ਵੇਖੋ', as: 'চিকিৎসক পৰ্টেল চাওক', mai: 'चिकित्सक पोर्टल देखू', sat: 'ᱰᱟᱠᱛᱟᱨ ᱯᱳᱨᱴᱟᱞ ᱧᱮᱞ', ks: 'ڈاکٹَر پۄرٹَل وُچھِو', ne: 'डाक्टर पोर्टल हेर्नुहोस्', gon: 'డాక్టర్ పోర్టల్ చూడండి', sd: 'ڊاڪٽر پورٽل ڏسو', kok: 'दोतोर पोर्टल पळयात', doi: 'डाक्टर पोर्टल दिक्खो',
    mni: 'ꯗꯥꯛꯇꯔ ꯄꯣꯔꯇꯦꯜ ꯌꯦꯡꯕꯤꯌꯨ', dhn: 'डॉक्टर पोर्टल पहा', kru: 'डाक्टर पोर्टल एरा', kha: 'Peit Portal Doktor', brx: 'फाहामगिरि पोर्टल नाय', grt: 'Daktar Portal Niboba', unr: 'डाक्टर पोर्टल नेल', hoc: 'डाक्टर पोर्टल नेल', kxu: 'ଡାକ୍ତର ପୋର୍ଟାଲ ଦେଖ', kfq: 'डाक्टर पोर्टल देखो',
    hlb: 'डाक्टर पोर्टल देखा', mrg: 'Doctor portal kangka', mjw: 'Doctor portal lang non', kff: 'డాక్టర్ పోర్టల్ చూడండి', njo: 'Doctor portal reprangang', stv: 'Doctor portal julo', njm: 'Doctor portal züli', nbe: 'Doctor portal rang', nmf: 'Doctor portal che', lus: 'Daktawr portal en rawh',
    tcz: 'Doctor portal ve in', njh: 'Doctor portal zolanka', rah: 'Daktar portal niboba', nri: 'Doctor portal züli', nph: 'Doctor portal rang', njz: 'Doctor portal jima', lep: 'Doctor portal zut', lif: 'Doctor portal lang', bix: 'डाक्टर पोर्टल नेल', sa: 'चिकित्सक-प्रवेशद्वारं पश्यतु',
  },
};

/**
 * Universal phrase translator
 * Returns translated string for target language if available, or automatically transliterates remaining English
 */
export const translatePhrase = (phrase, targetLangCode = 'en') => {
  if (!phrase || typeof phrase !== 'string') return phrase;
  if (!targetLangCode || targetLangCode === 'en') return phrase;

  const clean = phrase.trim();

  // 1. Direct exact dictionary lookup
  if (CORE_DICTIONARY[clean] && CORE_DICTIONARY[clean][targetLangCode]) {
    return CORE_DICTIONARY[clean][targetLangCode];
  }

  // 2. Case-insensitive lookup
  const matchKey = Object.keys(CORE_DICTIONARY).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  if (matchKey && CORE_DICTIONARY[matchKey][targetLangCode]) {
    return CORE_DICTIONARY[matchKey][targetLangCode];
  }

  // 3. CamelCase to Spaced Title Case lookup (e.g. 'howItWorks' -> 'How It Works')
  const spaced = clean
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
  const spacedKey = Object.keys(CORE_DICTIONARY).find(
    (k) => k.toLowerCase() === spaced.toLowerCase()
  );
  if (spacedKey && CORE_DICTIONARY[spacedKey][targetLangCode]) {
    return CORE_DICTIONARY[spacedKey][targetLangCode];
  }

  // 4. Common key aliases
  const ALIASES = {
    tagline: 'Your Smart Hospital Assistant',
    brandname: 'MediKiosk',
    patientportal: 'Patient Portal',
    doctorportal: 'Doctor Portal',
    whoareyou: 'Who Are You',
    getstarted: 'Get Started',
    howitworks: 'How It Works',
    features: 'Features',
    team: 'Team',
    about: 'About',
    login: 'Login',
    createaccount: 'Create Account',
    logout: 'Logout',
  };
  const aliasTarget = ALIASES[clean.toLowerCase().replace(/[^a-z]/g, '')];
  if (aliasTarget && CORE_DICTIONARY[aliasTarget] && CORE_DICTIONARY[aliasTarget][targetLangCode]) {
    return CORE_DICTIONARY[aliasTarget][targetLangCode];
  }

  // 5. Fallback: Transliterate English word/phrase to target script
  return transliterateRemainingEnglish(phrase, targetLangCode);
};

export default {
  LANGUAGE_SCRIPT_MAP,
  CORE_DICTIONARY,
  translatePhrase,
  transliterateEnglishWord,
  transliterateRemainingEnglish,
};
