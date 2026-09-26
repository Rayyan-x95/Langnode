export interface Language {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  greeting: string;
  placeholder: string;
  sampleTopics: {
    title: string;
    concept: string;
  }[];
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    greeting: 'Hello! What concept would you like to explore today?',
    placeholder: 'Ask about any concept (e.g., Recursion, Photosynthesis)...',
    sampleTopics: [
      { title: 'Data Structures', concept: 'Explain Binary Search Trees with a library analogy' },
      { title: 'Computer Networks', concept: 'How does the TCP/IP handshake work?' },
      { title: 'Machine Learning', concept: 'What is Gradient Descent in simple terms?' },
      { title: 'Physics', concept: 'Explain Quantum Entanglement simply' },
    ],
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    greeting: 'வணக்கம்! இன்று எந்த கருத்தை கற்றுக் கொள்ள விரும்புகிறீர்கள்?',
    placeholder: 'எந்தவொரு கருத்தையும் கேளுங்கள் (எ.கா. சுழல்முறை, ஒளிச்சேர்க்கை)...',
    sampleTopics: [
      { title: 'தரவு கட்டமைப்புகள்', concept: 'பைனரி தேடல் மரத்தை (Binary Search Tree) எளிதாக விளக்குக' },
      { title: 'நெட்வொர்க்கிங்', concept: 'TCP மூன்று வழி கைகுலுக்கல் (Handshake) எவ்வாறு இயங்குகிறது?' },
      { title: 'இயந்திரக் கற்றல்', concept: 'கிரேடியன்ட் டிசென்ட் (Gradient Descent) என்றால் என்ன?' },
      { title: 'இயற்பியல்', concept: 'குவாண்டம் என்டாங்கிள்மென்ட் பற்றி விளக்குக' },
    ],
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    greeting: 'नमस्ते! आज आप किस अवधारणा को समझना चाहते हैं?',
    placeholder: 'कोई भी अवधारणा पूछें (उदा. रिकर्शन, प्रकाश संश्लेषण)...',
    sampleTopics: [
      { title: 'डेटा संरचनाएं', concept: 'बाइनरी सर्च ट्री को एक आसान उदाहरण से समझाएं' },
      { title: 'कंप्यूटर नेटवर्क', concept: 'TCP 3-वे हैंडशेक कैसे काम करता है?' },
      { title: 'मशीन लर्निंग', concept: 'ग्रेडिएंट डिसेंट (Gradient Descent) क्या है?' },
      { title: 'भौतिकी', concept: 'क्वांटम एंटैंगलमेंट को सरल भाषा में समझाएं' },
    ],
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    greeting: 'నమస్కారం! ఈరోజు మీరు ఏ అంశాన్ని నేర్చుకోవాలనుకుంటున్నారు?',
    placeholder: 'ఏదైనా భావనను అడగండి (ఉదా. రికర్షన్, కిరణజన్య సంయోగక్రియ)...',
    sampleTopics: [
      { title: 'డేటా స్ట్రక్చర్స్', concept: 'బైనరీ సెర్చ్ ట్రీని సులభమైన ఉదాహరణతో వివరించండి' },
      { title: 'నెట్‌వర్కింగ్', concept: 'TCP 3-వే హ్యాండ్‌షేక్ ఎలా పనిచేస్తుంది?' },
      { title: 'మెషిన్ లెర్నింగ్', concept: 'గ్రేడియంట్ డిసెంట్ అంటే ఏమిటి?' },
      { title: 'భౌతిక శాస్త్రం', concept: 'క్వాంటం ఎంటాంగిల్‌మెంట్ అంటే ఏమిటి?' },
    ],
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    greeting: 'നമസ്കാരം! ഇന്ന് ഏത് ആശയമാണ് പഠിക്കാൻ ആഗ്രഹിക്കുന്നത്?',
    placeholder: 'ഏതെങ്കിലും ആശയം ചോദിക്കൂ (ഉദാ. റിക്കർഷൻ, പ്രകാശസംശ്ലേഷണം)...',
    sampleTopics: [
      { title: 'ഡാറ്റ ഘടനകൾ', concept: 'ബൈനറി സെർച്ച് ട്രീ ലളിതമായ ഉദാഹരണത്തിലൂടെ വിവരിക്കുക' },
      { title: 'നെറ്റ്‌വർക്കിങ്', concept: 'TCP 3-വേ ഹാൻഡ്ഷെയ്ക്ക് എങ്ങനെ പ്രവർത്തിക്കുന്നു?' },
      { title: 'മെഷീൻ ലേണിംഗ്', concept: 'ഗ്രേഡിയന്റ് ഡിസെന്റ് എന്താണ്?' },
      { title: 'ഭൗതികശാസ്ത്രം', concept: 'ക്വാണ്ടം എൻടാംഗിൾമെന്റ് ലളിതമായി വിശദീകരിക്കുക' },
    ],
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    greeting: 'ನಮಸ್ಕಾರ! ಇಂದು ನೀವು ಯಾವ ಪರಿಕಲ್ಪನೆಯನ್ನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?',
    placeholder: 'ಯಾವುದೇ ಪರಿಕಲ್ಪನೆಯನ್ನು ಕೇಳಿ (ಉದಾ. ಪುನರಾವರ್ತನೆ, ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ)...',
    sampleTopics: [
      { title: 'ಡೇಟಾ ರಚನೆಗಳು', concept: 'ಬೈನರಿ ಸರ್ಚ್ ಟ್ರೀಯನ್ನು ಸರಳ ಉದಾಹರಣೆಯೊಂದಿಗೆ ವಿವರಿಸಿ' },
      { title: 'ನೆಟ್‌ವರ್ಕಿಂಗ್', concept: 'TCP 3-ವೇ ಹ್ಯಾಂಡ್‌ಶೇಕ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?' },
      { title: 'ಮೆಷಿನ್ ಲರ್ನಿಂಗ್', concept: 'ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ ಎಂದರೇನು?' },
      { title: 'ಭೌತಶಾಸ್ತ್ರ', concept: 'ಕ್ವಾಂಟಮ್ ಎಂಟ್ಯಾಂಗಲ್ಮೆಂಟ್ ಅನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಿ' },
    ],
  },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];

export function getLanguageByCode(code: string): Language {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) || DEFAULT_LANGUAGE;
}
