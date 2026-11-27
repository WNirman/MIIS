/// Sri Lanka marine species guide data (public, non-confidential).
/// IUCN values mirror analysis/reference/species_reference.csv (global Red List).
class Species {
  final String id;
  final String category; // turtles | cetaceans | dugong | sharks
  final String sci;
  final String family;
  final String order;
  final String iucn;
  final String iucnNote;
  final List<String> names; // [en, si, ta]
  final List<String> desc; // [en, si, ta]
  final String reportTaxon; // value sent to backend (taxon_group)

  const Species({
    required this.id,
    required this.category,
    required this.sci,
    required this.family,
    required this.order,
    required this.iucn,
    required this.iucnNote,
    required this.names,
    required this.desc,
    required this.reportTaxon,
  });

  String name(int lang) => names[lang.clamp(0, 2)];
  String description(int lang) => desc[lang.clamp(0, 2)].isEmpty ? desc[0] : desc[lang.clamp(0, 2)];
}

class SpeciesCategory {
  final String id;
  final String labelKey;
  final String emoji;
  final String image;
  const SpeciesCategory(this.id, this.labelKey, this.emoji, this.image);
}

const List<SpeciesCategory> kSpeciesCategories = [
  SpeciesCategory('turtles', 'cat.turtles', '🐢', 'assets/hero/sl_rekawa_turtle.jpg'),
  SpeciesCategory('cetaceans', 'cat.cetaceans', '🐋', 'assets/hero/sl_mirissa_bluewhale.jpg'),
  SpeciesCategory('dugong', 'cat.dugong', '🦭', 'assets/hero/sl_mannar_dugong_coast.jpg'),
  SpeciesCategory('sharks', 'cat.sharks', '🦈', 'assets/hero/sl_pigeon_island_reef.jpg'),
];

const List<Species> kSpecies = [
  // ---------------- Sea turtles ----------------
  Species(
    id: 'olive-ridley',
    category: 'turtles',
    sci: 'Lepidochelys olivacea',
    family: 'Cheloniidae',
    order: 'Testudines',
    iucn: 'VU',
    iucnNote: 'IUCN Global Vulnerable (2025/2026)',
    names: ['Olive ridley turtle', 'බටු කැස්බෑවා', 'ஒலிவ் ரிட்லி ஆமை'],
    desc: [
      'The most frequently recorded turtle on Sri Lankan beaches. Small, olive-grey heart-shaped shell; nests in large numbers at Rekawa, Kosgoda and along the south-west coast.',
      'ශ්‍රී ලංකා වෙරළවල වැඩිම වාර ගණනක් වාර්තා වන කැස්බෑවාය. කුඩා, ඔලිව් අළු පැහැති හදවත් හැඩැති කටුවක් ඇත; රැකව, කොස්ගොඩ සහ නිරිත දිග වෙරළ දිගේ බිත්තර දමයි.',
      'இலங்கைக் கடற்கரைகளில் அதிகம் பதிவாகும் ஆமை. சிறிய, ஒலிவ்-சாம்பல் நிற இதய வடிவ ஓடு; ரெக்காவ, கொஸ்கொட மற்றும் தென்மேற்குக் கரையில் முட்டையிடுகிறது.'
    ],
    reportTaxon: 'Sea turtle',
  ),
  Species(
    id: 'green-turtle',
    category: 'turtles',
    sci: 'Chelonia mydas',
    family: 'Cheloniidae',
    order: 'Testudines',
    iucn: 'LC',
    iucnNote: 'Downlisted from EN to LC globally in Oct 2025 (Sri Lanka national Red List: EN)',
    names: ['Green turtle', 'ගල් කැස්බෑවා', 'பச்சை ஆமை'],
    desc: [
      'A large, mostly vegetarian turtle that grazes on seagrass beds in the Gulf of Mannar and Kalpitiya, and also nests along the south and east coasts.',
      'මන්නාරම් බොක්ක සහ කල්පිටියේ මුහුදු තෘණ බිම්වල පෝෂණය වන විශාල, බොහෝවිට ශාකභක්ෂක කැස්බෑවෙකි; දකුණු හා නැගෙනහිර වෙරළවලද බිත්තර දමයි.',
      'மன்னார் வளைகுடா மற்றும் கற்பிட்டியின் கடற்புல் படுகைகளில் மேயும் பெரிய, பெரும்பாலும் தாவர உண்ணி ஆமை; தெற்கு மற்றும் கிழக்குக் கரைகளிலும் முட்டையிடுகிறது.'
    ],
    reportTaxon: 'Sea turtle',
  ),
  Species(
    id: 'hawksbill',
    category: 'turtles',
    sci: 'Eretmochelys imbricata',
    family: 'Cheloniidae',
    order: 'Testudines',
    iucn: 'CR',
    iucnNote: 'IUCN Global Critically Endangered',
    names: ['Hawksbill turtle', 'පොතු කැස්බෑවා', 'அழுங்காமை'],
    desc: [
      'Recognised by its narrow, hawk-like beak and overlapping shell plates. Lives on coral reefs such as Hikkaduwa and Bar Reef and is critically endangered.',
      'පටු උකුස්සන් ස්වරූප හොටයෙන් සහ අතිච්ඡාදිත කටු තහඩුවලින් හඳුනාගත හැක. හික්කඩුව සහ බාර් රීෆ් වැනි කොරල්පරවල ජීවත් වන අතර ඉතා බරපතල ලෙස වඳවීමේ තර්ජනයට ලක්ව ඇත.',
      'குறுகிய பருந்து போன்ற அலகு மற்றும் ஒன்றன்மேல் ஒன்றான ஓடு தகடுகளால் அடையாளம் காணலாம். ஹிக்கடுவை, பார் ரீஃப் போன்ற பவளப்பாறைகளில் வாழ்கிறது; அழிவின் விளிம்பில் உள்ளது.'
    ],
    reportTaxon: 'Sea turtle',
  ),
  Species(
    id: 'loggerhead',
    category: 'turtles',
    sci: 'Caretta caretta',
    family: 'Cheloniidae',
    order: 'Testudines',
    iucn: 'VU',
    iucnNote: 'IUCN Global Vulnerable (North Indian Ocean subpopulation: CR)',
    names: ['Loggerhead turtle', 'ඔළුගෙඩි කැස්බෑවා', 'பெருந்தலை ஆமை'],
    desc: [
      'Large head and powerful jaws for crushing crabs and shellfish. A rare nesting visitor in Sri Lanka with a reddish-brown shell.',
      'කකුලන් සහ බෙල්ලන් කඩා කෑමට සුදුසු විශාල හිසක් සහ ශක්තිමත් හකු ඇත. රතු-දුඹුරු කටුවක් සහිත, ශ්‍රී ලංකාවේ දුර්ලභ බිත්තර දමන අමුත්තෙකි.',
      'நண்டு, சிப்பிகளை நசுக்கப் பெரிய தலையும் வலுவான தாடையும் கொண்டது. செங்கபில நிற ஓடுடன் இலங்கையில் அரிதாக முட்டையிட வரும் ஆமை.'
    ],
    reportTaxon: 'Sea turtle',
  ),
  Species(
    id: 'leatherback',
    category: 'turtles',
    sci: 'Dermochelys coriacea',
    family: 'Dermochelyidae',
    order: 'Testudines',
    iucn: 'VU',
    iucnNote: 'IUCN Global Vulnerable',
    names: ['Leatherback turtle', 'දාර කැස්බෑවා', 'தோணி ஆமை'],
    desc: [
      'The largest sea turtle: no hard shell, but a leathery back with seven ridges. Dives very deep to feed on jellyfish and is often caught accidentally in nets.',
      'විශාලතම මුහුදු කැස්බෑවාය: තද කටුවක් නැත, නමුත් රේඛා හතක් සහිත සම් වැනි පිටක් ඇත. ජෙලි මත්ස්‍යයන් කෑමට ගැඹුරට කිමිදෙන අතර බොහෝවිට දැල්වලට අහම්බෙන් පැටලේ.',
      'மிகப்பெரிய கடல் ஆமை: கடினமான ஓடு இல்லை, ஆனால் ஏழு கோடுகளுடன் தோல் போன்ற முதுகு. ஜெல்லிமீன்களை உண்ணக் கடலின் ஆழம் வரை மூழ்கும்; வலைகளில் தற்செயலாகச் சிக்குவதுண்டு.'
    ],
    reportTaxon: 'Sea turtle',
  ),

  // ---------------- Whales & dolphins ----------------
  Species(
    id: 'blue-whale',
    category: 'cetaceans',
    sci: 'Balaenoptera musculus',
    family: 'Balaenopteridae',
    order: 'Artiodactyla',
    iucn: 'EN',
    iucnNote: 'IUCN Global Endangered (Northern Indian Ocean resident population)',
    names: ['Blue whale', 'නිල් තල්මසා', 'நீலத் திமிங்கிலம்'],
    desc: [
      'The largest animal on Earth. A resident population lives off Mirissa and Trincomalee year-round, in the busy shipping lane south of the island.',
      'පෘථිවියේ විශාලතම සත්ත්වයාය. මිරිස්ස සහ ත්‍රිකුණාමලය ආසන්නයේ වසර පුරා ජීවත් වන ප්‍රජාවක් ඇති අතර, දිවයිනට දකුණින් ඇති කාර්යබහුල නැව් මාර්ගයේ ගමන් කරයි.',
      'பூமியின் மிகப்பெரிய உயிரினம். மிரிஸ்ஸா மற்றும் திருகோணமலைக் கடலில் ஆண்டு முழுவதும் வாழும் கூட்டம் உண்டு; தீவுக்குத் தெற்கேயுள்ள பரபரப்பான கப்பல் பாதையில் செல்கிறது.'
    ],
    reportTaxon: 'Whale',
  ),
  Species(
    id: 'sperm-whale',
    category: 'cetaceans',
    sci: 'Physeter macrocephalus',
    family: 'Physeteridae',
    order: 'Artiodactyla',
    iucn: 'VU',
    iucnNote: 'IUCN Global Vulnerable',
    names: ['Sperm whale', 'ස්පර්ම් තල්මසා', 'விந்துத் திமிங்கிலம்'],
    desc: [
      'A deep-diving toothed whale with a huge square head, seen in the deep waters off Trincomalee, Mirissa and Kalpitiya hunting squid.',
      'විශාල සමචතුරස්‍රාකාර හිසක් සහිත ගැඹුරට කිමිදෙන දත් තල්මසෙකි; ත්‍රිකුණාමලය, මිරිස්ස සහ කල්පිටිය ගැඹුරු මුහුදේ දැරිවැල්ලන් දඩයම් කරයි.',
      'பெரிய சதுரத் தலையுடன் ஆழமாக மூழ்கும் பல்லுடைய திமிங்கிலம்; திருகோணமலை, மிரிஸ்ஸா மற்றும் கற்பிட்டியின் ஆழ்கடலில் கணவாய்களை வேட்டையாடுகிறது.'
    ],
    reportTaxon: 'Whale',
  ),
  Species(
    id: 'brydes-whale',
    category: 'cetaceans',
    sci: 'Balaenoptera edeni',
    family: 'Balaenopteridae',
    order: 'Artiodactyla',
    iucn: 'LC',
    iucnNote: 'IUCN Global Least Concern (often confused with blue whale in field records)',
    names: ["Bryde's whale", 'බ්‍රයිඩ් තල්මසා', 'பிரைடு திமிங்கிலம்'],
    desc: [
      'A medium-sized rorqual with three ridges on its head. Frequently seen close to the coast and sometimes mistaken for a blue whale.',
      'හිස මත රේඛා තුනක් සහිත මධ්‍යම ප්‍රමාණයේ තල්මසෙකි. වෙරළට ආසන්නයේ නිතර දක්නට ලැබෙන අතර සමහරවිට නිල් තල්මසෙකු ලෙස වරදවා හඳුනා ගනී.',
      'தலையில் மூன்று கோடுகளுடன் கூடிய நடுத்தர அளவு திமிங்கிலம். கரைக்கு அருகில் அடிக்கடி காணப்படும்; சில வேளைகளில் நீலத் திமிங்கிலமாகத் தவறாக அடையாளம் காணப்படும்.'
    ],
    reportTaxon: 'Whale',
  ),
  Species(
    id: 'spinner-dolphin',
    category: 'cetaceans',
    sci: 'Stenella longirostris',
    family: 'Delphinidae',
    order: 'Artiodactyla',
    iucn: 'LC',
    iucnNote: 'IUCN Global Least Concern',
    names: ['Spinner dolphin', 'ස්පිනර් ඩොල්ෆින්', 'சுழல் டால்பின்'],
    desc: [
      'Famous for leaping and spinning in the air. Large pods are seen off Kalpitiya, Trincomalee and Mirissa and are a pillar of local dolphin tourism.',
      'වාතයේ පැනීමට සහ කැරකීමට ප්‍රසිද්ධය. කල්පිටිය, ත්‍රිකුණාමලය සහ මිරිස්ස ආසන්නයේ විශාල රංචු දක්නට ලැබෙන අතර දේශීය ඩොල්ෆින් සංචාරකයේ ප්‍රධාන ආකර්ෂණයකි.',
      'காற்றில் துள்ளிச் சுழல்வதற்குப் பிரபலமானது. கற்பிட்டி, திருகோணமலை, மிரிஸ்ஸாவில் பெரிய கூட்டங்கள் காணப்படுகின்றன; உள்ளூர் டால்பின் சுற்றுலாவின் தூண்.'
    ],
    reportTaxon: 'Dolphin',
  ),
  Species(
    id: 'pilot-whale',
    category: 'cetaceans',
    sci: 'Globicephala macrorhynchus',
    family: 'Delphinidae',
    order: 'Artiodactyla',
    iucn: 'LC',
    iucnNote: 'IUCN Global Least Concern',
    names: ['Short-finned pilot whale', 'කෙටි වරල් පයිලට් තල්මසා', 'குறுந்துடுப்பு பைலட் திமிங்கிலம்'],
    desc: [
      'A social, dark-grey toothed whale with a bulbous head. Mass strandings of pilot whales have been recorded on the Sri Lankan coast.',
      'බල්බ ස්වරූපී හිසක් සහිත සමාජශීලී, තද අළු පැහැති දත් තල්මසෙකි. ශ්‍රී ලංකා වෙරළේ පයිලට් තල්මසුන්ගේ සමූහ ගොඩගැසීම් වාර්තා වී ඇත.',
      'குமிழ் போன்ற தலையுடன் கூடிய, கூட்டமாக வாழும் அடர் சாம்பல் நிறத் திமிங்கிலம். இலங்கைக் கரையில் பைலட் திமிங்கிலங்களின் கூட்டக் கரையொதுங்கல்கள் பதிவாகியுள்ளன.'
    ],
    reportTaxon: 'Whale',
  ),
  Species(
    id: 'humpback-dolphin',
    category: 'cetaceans',
    sci: 'Sousa plumbea',
    family: 'Delphinidae',
    order: 'Artiodactyla',
    iucn: 'EN',
    iucnNote: 'Regional species of genus Sousa; IUCN Endangered',
    names: ['Indian Ocean humpback dolphin', 'ඉන්දියන් සාගර ඉස්කම්බු ඩොල්ෆින්', 'இந்து சமுத்திரக் கூன் டால்பின்'],
    desc: [
      'A shy, slow-moving dolphin of shallow coastal and estuarine waters, making it vulnerable to gillnets and coastal development.',
      'නොගැඹුරු වෙරළබඩ සහ මෝය ජලයේ ජීවත් වන, ලජ්ජාශීලී, සෙමින් ගමන් කරන ඩොල්ෆින් විශේෂයකි; ගිල් දැල් සහ වෙරළ සංවර්ධනයට ඉතා පහසුවෙන් ගොදුරු වේ.',
      'ஆழமற்ற கரையோர மற்றும் முகத்துவார நீரில் வாழும், கூச்ச சுபாவமுள்ள, மெதுவாக நகரும் டால்பின்; இழுவலைகள் மற்றும் கடற்கரை மேம்பாட்டால் எளிதில் பாதிக்கப்படும்.'
    ],
    reportTaxon: 'Dolphin',
  ),
  Species(
    id: 'finless-porpoise',
    category: 'cetaceans',
    sci: 'Neophocaena phocaenoides',
    family: 'Phocoenidae',
    order: 'Artiodactyla',
    iucn: 'VU',
    iucnNote: 'IUCN Global Vulnerable',
    names: ['Indo-Pacific finless porpoise', 'වරල් රහිත පෝපෝයිස්', 'முதுகுத்துடுப்பற்ற போர்போய்ஸ்'],
    desc: [
      'A small porpoise with no dorsal fin, found in shallow coastal waters. Often entangled in fishing nets.',
      'පිටු වරලක් නොමැති කුඩා පෝපෝයිස් විශේෂයකි; නොගැඹුරු වෙරළබඩ ජලයේ දක්නට ලැබේ. බොහෝවිට ධීවර දැල්වල පැටලේ.',
      'முதுகுத் துடுப்பு இல்லாத சிறிய போர்போய்ஸ்; ஆழமற்ற கரையோர நீரில் காணப்படும். மீன்பிடி வலைகளில் அடிக்கடி சிக்குகிறது.'
    ],
    reportTaxon: 'Dolphin',
  ),

  // ---------------- Dugong ----------------
  Species(
    id: 'dugong',
    category: 'dugong',
    sci: 'Dugong dugon',
    family: 'Dugongidae',
    order: 'Sirenia',
    iucn: 'VU',
    iucnNote: 'IUCN Global Vulnerable (Sri Lanka / Gulf of Mannar population locally critically endangered)',
    names: ['Dugong', 'මුහුදු ඌරා (ඩුගොන්ග්)', 'கடற்பசு (துகோங்)'],
    desc: [
      'A gentle marine mammal that grazes on seagrass in the Gulf of Mannar, Palk Bay and Puttalam lagoon. Extremely rare in Sri Lanka — report every sighting or stranding immediately.',
      'මන්නාරම් බොක්ක, පෝක් බොක්ක සහ පුත්තලම කලපුවේ මුහුදු තෘණ කන සන්සුන් සාගර ක්ෂීරපායියෙකි. ශ්‍රී ලංකාවේ අතිශයින් දුර්ලභයි — සෑම දැකීමක්ම හෝ ගොඩගැසීමක්ම වහාම වාර්තා කරන්න.',
      'மன்னார் வளைகுடா, பாக்கு விரிகுடா மற்றும் புத்தளக் களப்பில் கடற்புல் மேயும் சாந்தமான கடல் பாலூட்டி. இலங்கையில் மிக அரிது — ஒவ்வொரு காட்சியையும் கரையொதுங்கலையும் உடனே புகாரளிக்கவும்.'
    ],
    reportTaxon: 'Dugong',
  ),

  // ---------------- Sharks & rays ----------------
  Species(
    id: 'whale-shark',
    category: 'sharks',
    sci: 'Rhincodon typus',
    family: 'Rhincodontidae',
    order: 'Orectolobiformes',
    iucn: 'EN',
    iucnNote: 'IUCN Global Endangered',
    names: ['Whale shark', 'තල්මස් මෝරා', 'திமிங்கிலச் சுறா'],
    desc: [
      'The world\'s largest fish — a harmless filter-feeder with a spotted pattern. Occasionally seen off the south and east coasts of Sri Lanka.',
      'ලොව විශාලතම මත්ස්‍යයාය — ලප රටාවක් සහිත, හානිකර නොවන පෝෂකයෙකි. ශ්‍රී ලංකාවේ දකුණු සහ නැගෙනහිර වෙරළවලදී විටින් විට දක්නට ලැබේ.',
      'உலகின் மிகப்பெரிய மீன் — புள்ளி வடிவம் கொண்ட, தீங்கற்ற வடிகட்டி உண்ணி. இலங்கையின் தெற்கு, கிழக்குக் கடலில் எப்போதாவது காணப்படும்.'
    ],
    reportTaxon: 'Fish',
  ),
  Species(
    id: 'oceanic-whitetip',
    category: 'sharks',
    sci: 'Carcharhinus longimanus',
    family: 'Carcharhinidae',
    order: 'Carcharhiniformes',
    iucn: 'CR',
    iucnNote: 'IUCN Global Critically Endangered',
    names: ['Oceanic whitetip shark', 'සාගර සුදු-තුඩු මෝරා', 'கடல் வெண்முனைச் சுறா'],
    desc: [
      'An open-ocean shark with rounded white-tipped fins, now critically endangered because of longline and gillnet bycatch.',
      'වටකුරු සුදු තුඩු සහිත වරල් ඇති විවෘත සාගර මෝරෙකි; දිගු රැහැන් සහ ගිල් දැල් අහම්බෙන් ඇල්ලීම නිසා දැන් ඉතා බරපතල ලෙස වඳවීමේ තර්ජනයට ලක්ව ඇත.',
      'வட்டமான வெள்ளை முனைத் துடுப்புகளுடைய திறந்த கடல் சுறா; நீண்ட தூண்டில் மற்றும் இழுவலைகளில் தற்செயலாகச் சிக்குவதால் இப்போது அழிவின் விளிம்பில் உள்ளது.'
    ],
    reportTaxon: 'Fish',
  ),
];
