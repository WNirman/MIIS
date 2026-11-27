/// MIIS trilingual dictionary: every key holds [English, සිංහල, தமிழ்].
class AppStrings {
  static const langCodes = ['en', 'si', 'ta'];
  static const langNames = ['English', 'සිංහල', 'தமிழ்'];
  static const langShort = ['EN', 'සිං', 'தமி'];

  static String tr(int lang, String key) {
    final v = _s[key];
    if (v == null) return key;
    final out = v[lang.clamp(0, 2)];
    return out.isEmpty ? v[0] : out;
  }

  static Iterable<String> get keys => _s.keys;
  static List<String>? entry(String key) => _s[key];

  static const Map<String, List<String>> _s = {
    // ---- App ----
    'app.name': ['MIIS Sri Lanka', 'MIIS ශ්‍රී ලංකාව', 'MIIS இலங்கை'],
    'app.sub': ['Marine Incident Intelligence System', 'සාගර සිදුවීම් බුද්ධි පද්ධතිය', 'கடல்சார் சம்பவ நுண்ணறிவு அமைப்பு'],
    'common.cancel': ['Cancel', 'අවලංගු කරන්න', 'ரத்து'],
    'common.save': ['Save', 'සුරකින්න', 'சேமி'],
    'common.close': ['Close', 'වසන්න', 'மூடு'],
    'common.loading': ['Loading…', 'පූරණය වෙමින්…', 'ஏற்றுகிறது…'],

    // ---- Language gate ----
    'lang.title': ['Select your preferred language', 'ඔබ කැමති භාෂාව තෝරන්න', 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்'],
    'lang.sub': [
      'We will guide you step by step in the language you choose. You can change it any time from the menu.',
      'ඔබ තෝරන භාෂාවෙන් පියවරෙන් පියවර උපදෙස් දෙන්නෙමු. මෙනුවෙන් ඕනෑම වේලාවක වෙනස් කළ හැක.',
      'நீங்கள் தேர்ந்தெடுக்கும் மொழியில் படிப்படியாக வழிகாட்டுவோம். மெனுவிலிருந்து எப்போது வேண்டுமானாலும் மாற்றலாம்.'
    ],

    // ---- Join / Welcome ----
    'join.title': ['Join MIIS Sri Lanka', 'MIIS ශ්‍රී ලංකාවට එක්වන්න', 'MIIS இலங்கையில் இணையுங்கள்'],
    'join.desc': [
      'Reporting as a registered user lets you follow up on your sightings, earn conservation badges and receive news about the species and marine projects that interest you most. Fishers and coastal citizens can also report instantly without an account.',
      'ලියාපදිංචි පරිශීලකයෙකු ලෙස වාර්තා කිරීමෙන් ඔබගේ වාර්තා පිළිබඳ ඉදිරි ක්‍රියාමාර්ග දැන ගැනීමට, සංරක්ෂණ ලාංඡන ලබා ගැනීමට සහ ඔබ කැමති සාගර සත්ත්ව හා ව්‍යාපෘති පිළිබඳ පුවත් ලැබීමට හැකිය. ධීවරයින්ට සහ වෙරළබඩ ජනතාවට ගිණුමක් නොමැතිවද වහාම වාර්තා කළ හැකිය.',
      'பதிவு செய்த பயனராகப் புகாரளித்தால் உங்கள் புகார்களின் தொடர் நடவடிக்கைகளை அறியலாம், பாதுகாப்புப் பேட்ஜ்களைப் பெறலாம், உங்களுக்கு விருப்பமான உயிரினங்கள் மற்றும் கடல் திட்டங்கள் பற்றிய செய்திகளைப் பெறலாம். மீனவர்களும் கடற்கரைவாழ் மக்களும் கணக்கு இல்லாமலும் உடனடியாகப் புகாரளிக்கலாம்.'
    ],
    'join.login': ['Log in', 'පිවිසෙන්න', 'உள்நுழைக'],
    'join.create': ['Create new account', 'නව ගිණුමක් සාදන්න', 'புதிய கணக்கை உருவாக்கு'],
    'join.anon': ['Report without an account', 'ගිණුමක් නැතිව වාර්තා කරන්න', 'கணக்கு இல்லாமல் புகாரளி'],
    'join.anonHint': [
      'No login needed — built for fishers and coastal citizens.',
      'පිවිසුම අවශ්‍ය නැත — ධීවරයින් සහ වෙරළබඩ ජනතාව සඳහා.',
      'உள்நுழைவு தேவையில்லை — மீனவர்கள் மற்றும் கடற்கரை மக்களுக்காக.'
    ],

    // ---- Auth ----
    'auth.loginTitle': ['Login', 'පිවිසීම', 'உள்நுழைவு'],
    'auth.registerTitle': ['Create account', 'ගිණුම සාදන්න', 'கணக்கை உருவாக்கு'],
    'auth.email': ['Email', 'විද්‍යුත් තැපෑල', 'மின்னஞ்சல்'],
    'auth.password': ['Password', 'මුරපදය', 'கடவுச்சொல்'],
    'auth.passwordMin': ['Password (min 6 characters)', 'මුරපදය (අවම අකුරු 6)', 'கடவுச்சொல் (குறைந்தது 6 எழுத்துகள்)'],
    'auth.fullName': ['Full name', 'සම්පූර්ණ නම', 'முழுப் பெயர்'],
    'auth.org': ['Organisation (optional)', 'ආයතනය (විකල්ප)', 'அமைப்பு (விருப்பம்)'],
    'auth.district': ['Coastal district', 'වෙරළබඩ දිස්ත්‍රික්කය', 'கடற்கரை மாவட்டம்'],
    'auth.loginBtn': ['Log in', 'පිවිසෙන්න', 'உள்நுழைக'],
    'auth.registerBtn': ['Create account', 'ගිණුම සාදන්න', 'கணக்கை உருவாக்கு'],
    'auth.forgot': ['Forgot password', 'මුරපදය අමතකද', 'கடவுச்சொல் மறந்துவிட்டதா'],
    'auth.forgotMsg': [
      'Please contact the MIIS coordinator at the University of Jaffna to reset your password.',
      'මුරපදය යළි පිහිටුවීමට යාපනය විශ්වවිද්‍යාලයේ MIIS සම්බන්ධීකාරකව අමතන්න.',
      'கடவுச்சொல்லை மீட்டமைக்க யாழ்ப்பாணப் பல்கலைக்கழக MIIS ஒருங்கிணைப்பாளரைத் தொடர்பு கொள்ளவும்.'
    ],
    'auth.noAccount': ['Don\'t have an account?', 'ගිණුමක් නැද්ද?', 'கணக்கு இல்லையா?'],
    'auth.signUp': ['Sign up', 'ලියාපදිංචි වන්න', 'பதிவு செய்க'],
    'auth.haveAccount': ['Already registered?', 'දැනටමත් ලියාපදිංචිද?', 'ஏற்கனவே பதிவு செய்தீர்களா?'],
    'auth.signIn': ['Log in', 'පිවිසෙන්න', 'உள்நுழைக'],
    'auth.failed': [
      'Could not reach the MIIS server. Check your connection or the server address in Menu → Server.',
      'MIIS සේවාදායකයට සම්බන්ධ විය නොහැක. සම්බන්ධතාවය හෝ මෙනුව → සේවාදායකය හි ලිපිනය පරීක්ෂා කරන්න.',
      'MIIS சேவையகத்தை அடைய முடியவில்லை. இணைப்பு அல்லது மெனு → சேவையகம் முகவரியைச் சரிபார்க்கவும்.'
    ],
    'auth.required': ['Please fill in all required fields.', 'කරුණාකර අවශ්‍ය සියලු තොරතුරු පුරවන්න.', 'தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.'],

    // ---- Menu / drawer ----
    'menu.welcome': ['Welcome', 'සාදරයෙන් පිළිගනිමු', 'வரவேற்கிறோம்'],
    'menu.register': ['Register', 'ලියාපදිංචි වන්න', 'பதிவு செய்க'],
    'menu.anonymous': ['Anonymous reporter', 'නිර්නාමික වාර්තාකරු', 'அநாமதேய புகாராளர்'],
    'menu.species': ['Species guide', 'සත්ව මාර්ගෝපදේශය', 'உயிரின வழிகாட்டி'],
    'menu.news': ['Marine resources', 'සාගර සම්පත්', 'கடல் வளங்கள்'],
    'menu.sightings': ['Sightings', 'නිරීක්ෂණ', 'அவதானிப்புகள்'],
    'menu.report': ['Report incident', 'සිදුවීමක් වාර්තා කරන්න', 'சம்பவத்தைப் புகாரளி'],
    'menu.outbox': ['Sea outbox', 'යැවීමට ඇති වාර්තා', 'அனுப்பப்படவேண்டியவை'],
    'menu.projects': ['Projects & method', 'ව්‍යාපෘති සහ ක්‍රමවේදය', 'திட்டங்கள் & முறைமை'],
    'menu.web': ['Web version', 'වෙබ් අනුවාදය', 'இணையப் பதிப்பு'],
    'menu.validatorWeb': ['Validator portal (web)', 'විශේෂඥ පුවරුව (වෙබ්)', 'ஆய்வாளர் தளம் (இணையம்)'],
    'menu.contact': ['Contact', 'සම්බන්ධ වන්න', 'தொடர்புக்கு'],
    'menu.language': ['Language', 'භාෂාව', 'மொழி'],
    'menu.region': ['Region', 'ප්‍රදේශය', 'பகுதி'],
    'menu.regionAll': ['All Sri Lanka', 'මුළු ශ්‍රී ලංකාව', 'முழு இலங்கை'],
    'menu.server': ['Server', 'සේවාදායකය', 'சேவையகம்'],
    'menu.signout': ['Sign out', 'ඉවත් වන්න', 'வெளியேறு'],
    'server.title': ['MIIS server address', 'MIIS සේවාදායක ලිපිනය', 'MIIS சேவையக முகவரி'],
    'server.desc': [
      'Enter the address of the MIIS backend (for example the PC on your Wi-Fi or the deployed HTTPS server).',
      'MIIS පසුබිම් සේවාදායකයේ ලිපිනය ඇතුළත් කරන්න (උදා: Wi-Fi හි පරිගණකය හෝ ස්ථාපිත HTTPS සේවාදායකය).',
      'MIIS பின்புல சேவையகத்தின் முகவரியை உள்ளிடவும் (எ.கா. Wi-Fi கணினி அல்லது வெளியிடப்பட்ட HTTPS சேவையகம்).'
    ],

    // ---- Bottom nav ----
    'nav.home': ['Home', 'මුල්', 'முகப்பு'],
    'nav.report': ['Report', 'වාර්තා', 'புகார்'],
    'nav.sightings': ['Sightings', 'නිරීක්ෂණ', 'அவதானிப்பு'],
    'nav.species': ['Species', 'සත්ත්ව', 'உயிரினம்'],
    'nav.outbox': ['Outbox', 'යැවීම', 'அனுப்பு'],

    // ---- Highlights / Home tab ----
    'home.welcome': ['Welcome to', 'සාදරයෙන් පිළිගනිමු', 'நல்வரவு'],
    'home.highlights': ['Sri Lanka Marine Highlights', 'ශ්‍රී ලංකා සාගර විශේෂාංග', 'இலங்கை கடல் சிறப்புகள்'],
    'home.quickReport': ['Report marine incident now', 'සාගර සිදුවීමක් දැන් වාර්තා කරන්න', 'கடல் சம்பவத்தை இப்போது புகாரளி'],
    'home.quickReportSub': [
      'Works offline at sea • Satellite GPS + 2G SMS fallback • No login needed',
      'මුහුදේ අන්තර්ජාලය නැතත් ක්‍රියා කරයි • GPS + 2G SMS • පිවිසුම අවශ්‍ය නැත',
      'கடலில் இணையமின்றியும் வேலை செய்யும் • GPS + 2G SMS • உள்நுழைவு தேவையில்லை'
    ],
    'home.hl1Title': ['Blue whales & pelagic canyons', 'නිල් තල්මසුන් සහ ගැඹුරු සාගර කැනියම්', 'நீலத் திமிங்கிலங்கள் & ஆழ்கடல் பள்ளங்கள்'],
    'home.hl1Sub': ['Mirissa & Trincomalee • 25+ cetacean species', 'මිරිස්ස සහ ත්‍රිකුණාමලය • විශේෂ 25+', 'மிரிஸ்ஸா & திருகோணமலை • 25+ இனங்கள்'],
    'home.hl2Title': ['Five endangered sea turtle species', 'වඳවීමේ තර්ජනයට ලක්වූ කැස්බෑ විශේෂ 5', 'அருகிவரும் 5 கடல் ஆமை இனங்கள்'],
    'home.hl2Sub': ['Rekawa, Kosgoda & Mannar nesting beaches', 'රැකව, කොස්ගොඩ සහ මන්නාරම් වෙරළ', 'ரெக்காவ, கொஸ்கொட & மன்னார் கடற்கரைகள்'],
    'home.hl3Title': ['Coral reefs & coastal lagoons', 'කොරල්පර සහ වෙරළබඩ කලපු', 'பவளப்பாறைகள் & கடற்கரைக் களப்புகள்'],
    'home.hl3Sub': ['Pigeon Island, Hikkaduwa & Bar Reef', 'පරෙවි දූපත, හික්කඩුව සහ බාර් රීෆ්', 'புறாத்தீவு, ஹிக்கடுவை & பார் ரீஃப்'],
    'home.hl4Title': ['Seagrass meadows & rare Dugongs', 'මුහුදු තෘණ බිම් සහ දුර්ලභ ඩුගොන්ග්', 'கடற்புல் படுகைகள் & அரிய கடற்பசுக்கள்'],
    'home.hl4Sub': ['Gulf of Mannar, Puttalam & Jaffna islands', 'මන්නාරම් බොක්ක, පුත්තලම සහ යාපනය දූපත්', 'மன்னார் வளைகுடா, புத்தளம் & யாழ்ப்பாணத் தீவுகள்'],
    'home.hl5Title': ['Coastal fishers as sea guardians', 'සාගර ආරක්ෂකයින් ලෙස ධීවර ප්‍රජාව', 'கடல் பாதுகாவலர்களாக மீனவ சமூகம்'],
    'home.hl5Sub': ['14 coastal districts • 1,787 km Sri Lanka coast', 'වෙරළබඩ දිස්ත්‍රික්ක 14 • කි.මී. 1,787 වෙරළ', '14 கடற்கரை மாவட்டங்கள் • 1,787 கி.மீ கடற்கரை'],
    'auth.confirmPassword': ['Confirm password', 'මුරපදය තහවුරු කරන්න', 'கடவுச்சொல்லை உறுதிப்படுத்து'],
    'auth.passwordMismatch': ['Passwords do not match.', 'මුරපද දෙක නොගැලපේ.', 'கடவுச்சொற்கள் பொருந்தவில்லை.'],
    'map.layerDark': ['Dark Marine', 'අඳුරු සාගර', 'இருண்ட கடல்'],
    'map.layerOsm': ['OpenStreetMap', 'සාමාන්‍ය සිතියම', 'வரைபடம்'],
    'map.layerSat': ['Satellite Ocean', 'චන්ද්‍රිකා', 'செயற்கைக்கோள்'],

    // ---- Sightings ----
    'sight.title': ['Sightings', 'නිරීක්ෂණ', 'அவதானிப்புகள்'],
    'sight.species': ['Species', 'සත්ත්වයා', 'உயிரினம்'],
    'sight.from': ['From', 'සිට', 'முதல்'],
    'sight.until': ['Until', 'දක්වා', 'வரை'],
    'sight.list': ['List', 'ලැයිස්තුව', 'பட்டியல்'],
    'sight.map': ['Map', 'සිතියම', 'வரைபடம்'],
    'sight.empty': ['No sightings to show yet.', 'තවමත් පෙන්වීමට නිරීක්ෂණ නැත.', 'காட்ட அவதானிப்புகள் இன்னும் இல்லை.'],
    'sight.noteOwn': [
      'Showing the reports you submitted. Confidential national records are visible only to verified validators.',
      'ඔබ යොමු කළ වාර්තා පෙන්වයි. රහස්‍ය ජාතික වාර්තා තහවුරු කළ විශේෂඥයින්ට පමණක් පෙනේ.',
      'நீங்கள் சமர்ப்பித்த புகார்கள் காட்டப்படுகின்றன. இரகசிய தேசியப் பதிவுகள் சரிபார்க்கப்பட்ட ஆய்வாளர்களுக்கு மட்டுமே தெரியும்.'
    ],
    'sight.noteValidator': [
      'Validator view — all verified incident records are shown.',
      'විශේෂඥ දසුන — සියලු තහවුරු කළ සිදුවීම් වාර්තා පෙන්වයි.',
      'ஆய்வாளர் பார்வை — அனைத்துச் சரிபார்க்கப்பட்ட சம்பவப் பதிவுகளும் காட்டப்படுகின்றன.'
    ],
    'sight.sent': ['Sent', 'යැවිණි', 'அனுப்பப்பட்டது'],
    'sight.queued': ['Queued', 'පොරොත්තුවේ', 'காத்திருக்கிறது'],
    'sight.clear': ['Clear', 'මකන්න', 'அழி'],
    'sight.refresh': ['Refresh', 'නැවුම් කරන්න', 'புதுப்பி'],
    'sight.district': ['District', 'දිස්ත්‍රික්කය', 'மாவட்டம்'],
    'sight.date': ['Date', 'දිනය', 'திகதி'],
    'sight.coords': ['Coordinates', 'ඛණ්ඩාංක', 'ஆயத்தொலைவுகள்'],
    'sight.status': ['Status', 'තත්ත්වය', 'நிலை'],
    'sight.event': ['Incident', 'සිදුවීම', 'சம்பவம்'],
    'sight.expired': ['Your session expired. Please log in again to see server records.', 'ඔබගේ සැසිය අවසන්. සේවාදායක වාර්තා බැලීමට නැවත පිවිසෙන්න.', 'உங்கள் அமர்வு முடிந்தது. சேவையகப் பதிவுகளைக் காண மீண்டும் உள்நுழையவும்.'],

    // ---- Species guide ----
    'guide.title': ['Species guide', 'සත්ව මාර්ගෝපදේශය', 'உயிரின வழிகாட்டி'],
    'guide.divulgative': ['Divulgative', 'සරල', 'எளிய விளக்கம்'],
    'guide.scientific': ['Scientific', 'විද්‍යාත්මක', 'அறிவியல்'],
    'guide.search': ['Search by name', 'නමින් සොයන්න', 'பெயரால் தேடு'],
    'guide.noResults': ['No species match your search.', 'ඔබගේ සෙවුමට ගැළපෙන සත්ත්වයන් නැත.', 'உங்கள் தேடலுக்குப் பொருந்தும் உயிரினங்கள் இல்லை.'],
    'guide.species': ['species', 'විශේෂ', 'இனங்கள்'],
    'guide.sciName': ['Scientific name', 'විද්‍යාත්මක නාමය', 'அறிவியல் பெயர்'],
    'guide.family': ['Family', 'කුලය', 'குடும்பம்'],
    'guide.order': ['Order', 'ගෝත්‍රය', 'வரிசை'],
    'guide.iucn': ['IUCN status (global)', 'IUCN තත්ත්වය (ගෝලීය)', 'IUCN நிலை (உலகளாவிய)'],
    'guide.note': ['Assessment note', 'තක්සේරු සටහන', 'மதிப்பீட்டுக் குறிப்பு'],
    'guide.names': ['Names', 'නම්', 'பெயர்கள்'],
    'guide.about': ['About this species', 'මෙම සත්ත්වයා ගැන', 'இந்த உயிரினம் பற்றி'],
    'guide.reportThis': ['Report this species', 'මෙම සත්ත්වයා වාර්තා කරන්න', 'இந்த உயிரினத்தைப் புகாரளி'],
    'guide.disclaimer': [
      'IUCN categories are global Red List assessments; national status in Sri Lanka may differ.',
      'IUCN කාණ්ඩ ගෝලීය රතු ලැයිස්තු තක්සේරු වේ; ශ්‍රී ලංකාවේ ජාතික තත්ත්වය වෙනස් විය හැක.',
      'IUCN வகைகள் உலகளாவிய செம்பட்டியல் மதிப்பீடுகள்; இலங்கையின் தேசிய நிலை வேறுபடலாம்.'
    ],
    'cat.turtles': ['Sea turtles', 'මුහුදු කැස්බෑවන්', 'கடல் ஆமைகள்'],
    'cat.cetaceans': ['Whales & dolphins', 'තල්මසුන් සහ ඩොල්ෆින්', 'திமிங்கிலங்கள் & டால்பின்கள்'],
    'cat.dugong': ['Dugong', 'මුහුදු ඌරා (ඩුගොන්ග්)', 'கடற்பசு (துகோங்)'],
    'cat.sharks': ['Sharks & rays', 'මෝරුන් සහ මඩුවන්', 'சுறாக்கள் & திருக்கைகள்'],
    'iucn.CR': ['Critically Endangered', 'ඉතා බරපතල ලෙස වඳවීමේ තර්ජනයට ලක්වූ', 'அழிவின் விளிம்பில் (மிக அரிது)'],
    'iucn.EN': ['Endangered', 'වඳවීමේ තර්ජනයට ලක්වූ', 'அருகிவரும் இனம்'],
    'iucn.VU': ['Vulnerable', 'අවදානමට ලක්වූ', 'பாதிக்கப்படக்கூடியது'],
    'iucn.NT': ['Near Threatened', 'තර්ජනයට ආසන්න', 'அச்சுறுத்தலுக்கு அருகில்'],
    'iucn.LC': ['Least Concern', 'අවම සැලකිල්ල', 'குறைந்த கவலை'],

    // ---- Projects & method ----
    'proj.title': ['Projects & method', 'ව්‍යාපෘති සහ ක්‍රමවේදය', 'திட்டங்கள் & முறைமை'],
    'proj.intro': [
      'MIIS joins coastal field work, community co-design with Sri Lankan fishers, standard data protocols, automated AI screening and expert verification in five phases.',
      'MIIS මඟින් වෙරළබඩ ක්ෂේත්‍ර කටයුතු, ධීවරයින් සමඟ සම-නිර්මාණය, ප්‍රමිතිගත දත්ත ක්‍රමවේද, ස්වයංක්‍රීය AI පරීක්ෂාව සහ විශේෂඥ තහවුරු කිරීම පියවර පහකින් ඒකාබද්ධ කරයි.',
      'கடற்கரைக் கள ஆய்வு, மீனவர்களுடன் இணைந்த வடிவமைப்பு, தரப்படுத்தப்பட்ட தரவு நெறிமுறைகள், தானியங்கி AI வடிகட்டல் மற்றும் நிபுணர் சரிபார்ப்பை MIIS ஐந்து கட்டங்களில் இணைக்கிறது.'
    ],
    'proj.p1': ['Map reporting channels', 'වාර්තාකරණ මාර්ග හඳුනාගැනීම', 'புகார் வழிமுறைகளை வரைபடமாக்கல்'],
    'proj.p1d': [
      'Consultations with fishers, coastal residents, fisheries bodies, researchers and NGOs to map existing pathways and gaps.',
      'පවතින වාර්තාකරණ මාර්ග සහ අඩුපාඩු හඳුනාගැනීමට ධීවරයින්, ප්‍රජාව, ධීවර ආයතන, පර්යේෂකයින් සහ NGO සමඟ සාකච්ඡා.',
      'தற்போதுள்ள வழிகளையும் இடைவெளிகளையும் அறிய மீனவர்கள், சமூகங்கள், மீன்வள அமைப்புகள், ஆய்வாளர்கள் மற்றும் NGO-களுடன் கலந்துரையாடல்.'
    ],
    'proj.p2': ['Standardised field protocols', 'ප්‍රමිතිගත ක්ෂේත්‍ර ක්‍රමවේද', 'தரப்படுத்தப்பட்ட கள நெறிமுறைகள்'],
    'proj.p2d': [
      'A structured schema for event type, taxonomy, condition, coordinates, photo evidence and human-impact indicators.',
      'සිදුවීම් වර්ගය, සත්ව විශේෂය, තත්ත්වය, ඛණ්ඩාංක, ඡායාරූප සාක්ෂි සහ මිනිස් බලපෑම් සඳහා විධිමත් දත්ත ව්‍යුහයක්.',
      'சம்பவ வகை, உயிரின வகைப்பாடு, நிலை, ஆயத்தொலைவுகள், புகைப்படச் சான்று மற்றும் மனிதத் தாக்கக் குறியீடுகளுக்கான கட்டமைப்பு.'
    ],
    'proj.p3': ['Iterative coastal prototyping', 'ක්ෂේත්‍ර අත්හදා බැලීම', 'கள சோதனை & மேம்பாடு'],
    'proj.p3d': [
      'Field-testing lightweight reporting tools in real coastal conditions to refine GPS accuracy and safety guidance.',
      'සැබෑ වෙරළ තත්ත්වයන් යටතේ සැහැල්ලු වාර්තාකරණ මෙවලම් අත්හදා බලා GPS නිරවද්‍යතාවය සහ ආරක්ෂක උපදෙස් වැඩිදියුණු කිරීම.',
      'உண்மையான கடற்கரைச் சூழலில் எளிய புகார் கருவிகளைச் சோதித்து GPS துல்லியத்தையும் பாதுகாப்பு வழிகாட்டலையும் மேம்படுத்துதல்.'
    ],
    'proj.p4': ['Multi-tiered QC pipeline', 'බහු-මට්ටමේ තත්ත්ව පාලනය', 'பல-நிலை தரக்கட்டுப்பாடு'],
    'proj.p4d': [
      'Automated AI relevance screening plus marine-expert confirmation, while protecting sensitive locations.',
      'සංවේදී ස්ථාන ආරක්ෂා කරමින් ස්වයංක්‍රීය AI පරීක්ෂාව සහ සාගර විශේෂඥ තහවුරු කිරීම.',
      'உணர்திறன் இடங்களைப் பாதுகாத்தபடி தானியங்கி AI பகுப்பாய்வும் கடல்சார் நிபுணர் உறுதிப்படுத்தலும்.'
    ],
    'proj.p5': ['Scalable national database', 'ජාතික පර්යේෂණ දත්ත ගබඩාව', 'தேசிய ஆராய்ச்சித் தரவுத்தளம்'],
    'proj.p5d': [
      'An organised, georeferenced national repository for conservation, pollution monitoring, research and coastal governance.',
      'සංරක්ෂණය, දූෂණ නිරීක්ෂණය, පර්යේෂණ සහ වෙරළ පාලනය සඳහා විධිමත් ජාතික දත්ත ගබඩාවක්.',
      'பாதுகாப்பு, மாசு கண்காணிப்பு, ஆராய்ச்சி மற்றும் கடற்கரை நிர்வாகத்திற்கான ஒருங்கிணைந்த தேசியத் தரவுத்தளம்.'
    ],

    // ---- Contact ----
    'contact.title': ['Contact', 'සම්බන්ධ වන්න', 'தொடர்புக்கு'],
    'contact.org': ['MIIS Coordination', 'MIIS සම්බන්ධීකරණය', 'MIIS ஒருங்கிணைப்பு'],
    'contact.uni': ['University of Jaffna, Sri Lanka', 'යාපනය විශ්වවිද්‍යාලය, ශ්‍රී ලංකාව', 'யாழ்ப்பாணப் பல்கலைக்கழகம், இலங்கை'],
    'contact.web': ['Open MIIS website', 'MIIS වෙබ් අඩවිය විවෘත කරන්න', 'MIIS இணையதளத்தைத் திற'],
    'contact.linkedin': ['Project lead on LinkedIn', 'ව්‍යාපෘති නායක (LinkedIn)', 'திட்டத் தலைவர் (LinkedIn)'],
    'contact.note': [
      'Confidential records and validation are available only to verified MIIS validators on the web portal.',
      'රහස්‍ය වාර්තා සහ තහවුරු කිරීම වෙබ් පුවරුවේ තහවුරු කළ MIIS විශේෂඥයින්ට පමණක් ලබාගත හැක.',
      'இரகசியப் பதிவுகளும் சரிபார்ப்பும் இணையத் தளத்தில் சரிபார்க்கப்பட்ட MIIS ஆய்வாளர்களுக்கு மட்டுமே கிடைக்கும்.'
    ],

    // ---- Report ----
    'rep.title': ['Report incident', 'සිදුවීමක් වාර්තා කරන්න', 'சம்பவத்தைப் புகாரளி'],
    'rep.guided': ['Guided in English', 'සිංහල මාර්ගෝපදේශනය', 'தமிழ் வழிகாட்டுதல்'],
    'rep.safety': [
      'No login required • Stay 15 m away from live wildlife and do not touch oil or chemicals.',
      'පිවිසුම අවශ්‍ය නැත • පණ ඇති සතුන්ගෙන් මීටර් 15ක් දුරින් සිටින්න; තෙල් හෝ රසායන ඇල්ලීමෙන් වළකින්න.',
      'உள்நுழைவு தேவையில்லை • உயிருள்ள விலங்குகளிடமிருந்து 15 மீ தொலைவில் இருங்கள்; எண்ணெய் அல்லது இரசாயனங்களைத் தொடாதீர்கள்.'
    ],
    'rep.step1': ['1. Where did you see it?', '1. දුටු ස්ථානය', '1. எங்கே பார்த்தீர்கள்?'],
    'rep.step1Help': [
      'Tap the button while you are at the beach or on the boat. Satellite GPS works even without mobile internet.',
      'වෙරළේ හෝ බෝට්ටුවේ සිටියදීම බොත්තම ඔබන්න. අන්තර්ජාලය නැතත් චන්ද්‍රිකා GPS ක්‍රියා කරයි.',
      'கடற்கரை அல்லது படகில் இருக்கும்போதே பொத்தானை அழுத்தவும். இணையம் இல்லாமலும் செயற்கைக்கோள் GPS செயல்படும்.'
    ],
    'rep.lock': ['Drop GPS pin now', 'මගේ GPS ලබාගන්න', 'எனது GPS-ஐப் பெறு'],
    'rep.locking': ['Locking satellites…', 'GPS ලබාගනිමින්…', 'GPS பெறப்படுகிறது…'],
    'rep.gpsOff': ['Turn on phone GPS / Location in settings (works offline at sea).', 'දුරකථනයේ GPS / ස්ථානය සක්‍රීය කරන්න (මුහුදේදී අන්තර්ජාලයෙන් තොරවද ක්‍රියා කරයි).', 'தொலைபேசியின் GPS / இருப்பிடத்தை இயக்கவும் (கடலில் இணையமின்றியும் வேலை செய்யும்).'],
    'rep.gpsPerm': ['GPS permission is required to lock exact coordinates.', 'නිවැරදි ඛණ්ඩාංක ලබාගැනීමට GPS අවසරය අවශ්‍යයි.', 'துல்லிய ஆயத்தொலைவுகளுக்கு GPS அனுமதி தேவை.'],
    'rep.gpsTimeout': ['GPS fix timed out — move to open deck/sky and retry.', 'GPS ලබාගැනීම අසාර්ථකයි — විවෘත ස්ථානයකට ගොස් නැවත උත්සාහ කරන්න.', 'GPS பெற முடியவில்லை — திறந்த வெளிக்குச் சென்று மீண்டும் முயற்சிக்கவும்.'],
    'rep.gpsLocked': ['Satellite GPS locked', 'චන්ද්‍රිකා GPS ලබාගත්තා', 'செயற்கைக்கோள் GPS பெறப்பட்டது'],
    'rep.step2': ['2. What did you see?', '2. ඔබ දුටුවේ කුමක්ද?', '2. நீங்கள் என்ன பார்த்தீர்கள்?'],
    'rep.step2Help': [
      'Choose the animal or hazard, what happened, its condition and how many.',
      'සත්වයා හෝ උපද්‍රවය, සිදුවූ දේ, තත්ත්වය සහ ගණන තෝරන්න.',
      'விலங்கு அல்லது ஆபத்து, நிகழ்ந்தது, நிலை மற்றும் எண்ணிக்கையைத் தேர்ந்தெடுக்கவும்.'
    ],
    'rep.count': ['Count', 'ගණන', 'எண்ணிக்கை'],
    'rep.step3': ['3. Photo & short note (optional)', '3. ඡායාරූපය සහ කෙටි සටහන (විකල්ප)', '3. புகைப்படம் & சிறு குறிப்பு (விருப்பம்)'],
    'rep.hold': ['Hold photo until harbour Wi-Fi/4G', 'වරායේ Wi-Fi/4G ලැබෙන තුරු ඡායාරූපය තබාගන්න', 'துறைமுக Wi-Fi/4G கிடைக்கும் வரை புகைப்படத்தை வைத்திரு'],
    'rep.holdSub': ['A tiny GPS beacon (<500 B) is sent first on weak sea signal.', 'දුර්වල සංඥාවේදී ප්‍රථමයෙන් කුඩා GPS සංඥාවක් (<500 B) යැවේ.', 'பலவீனமான சிக்னலில் முதலில் சிறிய GPS சிக்னல் (<500 B) அனுப்பப்படும்.'],
    'rep.camera': ['Camera', 'කැමරාව', 'கேமரா'],
    'rep.noteHint': ['Optional note (e.g. net wrapped on flipper)', 'විකල්ප සටහනක් (උදා: දැල පැටලී ඇත)', 'விருப்பக் குறிப்பு (எ.கா. வலை சுற்றியுள்ளது)'],
    'rep.quick1': ['Net wrapped around body', 'සිරුරේ දැල් පැටලී ඇත', 'உடலில் வலை சுற்றியுள்ளது'],
    'rep.quick2': ['Alive and moving slowly', 'පණ ඇති අතර සෙමින් චලනය වේ', 'உயிருடன் மெதுவாக நகர்கிறது'],
    'rep.quick3': ['Washed onto sandy beach', 'වැලි වෙරළට ගොඩගසා ඇත', 'மணற்கடற்கரையில் கரை ஒதுங்கியுள்ளது'],
    'rep.quick4': ['Oil slick or chemical smell', 'තෙල් තට්ටුවක් හෝ රසායනික ගඳක්', 'எண்ணெய் படலம் அல்லது இரசாயன வாசனை'],
    'rep.quick5': ['Visible injury or boat strike', 'තුවාල හෝ බෝට්ටු ගැටීමක්', 'காயம் அல்லது படகு மோதல்'],
    'rep.quickLabel': ['Quick tags (tap to add):', 'ඉක්මන් සටහන් (එක් කිරීමට ඔබන්න):', 'விரைவுக் குறிப்புகள் (சேர்க்கத் தட்டவும்):'],
    'rep.submit': ['Send GPS report now', 'GPS වාර්තාව දැන් යවන්න', 'GPS புகாரை இப்போது அனுப்பு'],
    'rep.sending': ['Sending GPS beacon…', 'GPS සංඥාව යවමින්…', 'GPS சிக்னல் அனுப்பப்படுகிறது…'],
    'rep.sent': ['GPS beacon sent!', 'GPS සංඥාව යැවිණි!', 'GPS சிக்னல் அனுப்பப்பட்டது!'],
    'rep.saved': ['Saved safely offline!', 'අන්තර්ජාලයෙන් තොරව සුරක්ෂිතව සුරැකිණි!', 'இணையமின்றிப் பாதுகாப்பாகச் சேமிக்கப்பட்டது!'],
    'rep.savedSub': [
      'No signal detected. Your GPS and time are stored on this phone and can be sent now by 2G SMS.',
      'සංඥාවක් නැත. ඔබගේ GPS සහ වේලාව දුරකථනයේ සුරැකී ඇති අතර 2G SMS මඟින් දැන්ම යැවිය හැක.',
      'சிக்னல் இல்லை. உங்கள் GPS மற்றும் நேரம் இந்தத் தொலைபேசியில் சேமிக்கப்பட்டுள்ளது; 2G SMS மூலம் இப்போதே அனுப்பலாம்.'
    ],
    'rep.photoHeld': [
      'Your photo is held on this phone. Open the Outbox tab on harbour Wi-Fi/4G to upload it.',
      'ඡායාරූපය දුරකථනයේ තබා ඇත. වරායේ Wi-Fi/4G ලැබුණු විට යැවීම (Outbox) පටිත්ත විවෘත කරන්න.',
      'புகைப்படம் இந்தத் தொலைபேசியில் உள்ளது. துறைமுக Wi-Fi/4G-இல் அனுப்பு (Outbox) தாவலைத் திறக்கவும்.'
    ],
    'rep.sms': ['Send 2G SMS beacon', '2G SMS සංඥාව යවන්න', '2G SMS சிக்னல் அனுப்பு'],
    'rep.another': ['Report another incident', 'තවත් සිදුවීමක් වාර්තා කරන්න', 'மற்றொரு சம்பவத்தைப் புகாரளி'],
    'rep.ref': ['Reference', 'යොමු අංකය', 'குறிப்பு எண்'],
    'tax.turtle': ['Sea turtle', 'මුහුදු කැස්බෑවා', 'கடல் ஆமை'],
    'tax.dolphin': ['Dolphin', 'ඩොල්ෆින්', 'டால்பின்'],
    'tax.whale': ['Whale', 'තල්මසා', 'திமிங்கிலம்'],
    'tax.dugong': ['Dugong', 'මුහුදු ඌරා', 'கடற்பசு'],
    'tax.fish': ['Fish kill', 'මත්ස්‍ය මරණ', 'மீன் இறப்பு'],
    'tax.pollution': ['Oil / net', 'තෙල් / දැල්', 'எண்ணெய் / வலை'],
    'ev.liveStranded': ['Live stranded animal', 'පණ ඇති සතෙකු ගොඩගැසීම', 'உயிருடன் கரை ஒதுங்கியது'],
    'ev.entangled': ['Entangled animal', 'දැලක පැටලුණු සතෙකු', 'வலையில் சிக்கிய விலங்கு'],
    'ev.dead': ['Dead animal', 'මියගිය සතෙකු', 'இறந்த விலங்கு'],
    'ev.injured': ['Injured animal', 'තුවාල ලත් සතෙකු', 'காயமடைந்த விலங்கு'],
    'ev.oil': ['Oil pollution', 'තෙල් දූෂණය', 'எண்ணெய் மாசு'],
    'ev.ghost': ['Ghost net', 'අතහැර දැමූ දැල්', 'கைவிடப்பட்ட வலை'],
    'cond.alive': ['Alive', 'පණ ඇති', 'உயிருடன்'],
    'cond.entangled': ['Entangled', 'පැටලී ඇත', 'சிக்கியுள்ளது'],
    'cond.injured': ['Injured', 'තුවාල වී ඇත', 'காயம்'],
    'cond.dead': ['Dead', 'මියගොස් ඇත', 'இறந்தது'],

    // ---- Outbox ----
    'outbox.syncAll': ['Sync all beacons & harbour photos', 'සියලු සංඥා සහ ඡායාරූප යවන්න', 'அனைத்து சிக்னல்கள் & புகைப்படங்களை அனுப்பு'],
    'outbox.syncing': ['Syncing to MIIS…', 'MIIS වෙත යවමින්…', 'MIIS-க்கு அனுப்புகிறது…'],
    'outbox.empty': [
      'No reports saved yet.\nReports made at sea appear here automatically.',
      'තවමත් වාර්තා සුරැකී නැත.\nමුහුදේදී කරන වාර්තා මෙහි ස්වයංක්‍රීයව පෙනේ.',
      'இன்னும் புகார்கள் சேமிக்கப்படவில்லை.\nகடலில் செய்யும் புகார்கள் இங்கே தானாகத் தோன்றும்.'
    ],
    'outbox.result': ['Synced {b} GPS beacons and {p} harbour photos.', 'GPS සංඥා {b}ක් සහ ඡායාරූප {p}ක් යැවිණි.', '{b} GPS சிக்னல்கள் மற்றும் {p} புகைப்படங்கள் அனுப்பப்பட்டன.'],
    'outbox.gpsSent': ['GPS sent ✓', 'GPS යැවිණි ✓', 'GPS அனுப்பப்பட்டது ✓'],
    'outbox.gpsQueued': ['GPS queued', 'GPS පොරොත්තුවේ', 'GPS காத்திருக்கிறது'],
    'outbox.photoSent': ['Photo sent ✓', 'ඡායාරූපය යැවිණි ✓', 'புகைப்படம் அனுப்பப்பட்டது ✓'],
    'outbox.photoWaiting': ['Photo waiting', 'ඡායාරූපය බලා සිටී', 'புகைப்படம் காத்திருக்கிறது'],
    'outbox.sms': ['Send 2G SMS', '2G SMS යවන්න', '2G SMS அனுப்பு'],
  };
}
