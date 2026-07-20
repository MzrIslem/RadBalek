/// Macro level above wilayas: the four zones Algerians actually use.
/// Est / Centre / Ouest / Sud — static mapping, no backend needed.
library;

const Map<String, List<int>> regionMembers = {
  'est': [4, 5, 6, 7, 12, 18, 19, 21, 23, 24, 25, 34, 36, 40, 41, 43],
  'centre': [3, 9, 10, 15, 16, 17, 26, 28, 35, 42, 44],
  'ouest': [2, 13, 14, 20, 22, 27, 29, 31, 32, 38, 45, 46, 48],
  'sud': [1, 8, 11, 30, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
};

const Map<String, Map<String, String>> regionNames = {
  'est': {'fr': 'Est', 'en': 'East', 'ar': 'الشرق'},
  'centre': {'fr': 'Centre', 'en': 'Center', 'ar': 'الوسط'},
  'ouest': {'fr': 'Ouest', 'en': 'West', 'ar': 'الغرب'},
  'sud': {'fr': 'Sud', 'en': 'South', 'ar': 'الجنوب'},
};

String? regionOf(int wilayaCode) {
  for (final e in regionMembers.entries) {
    if (e.value.contains(wilayaCode)) return e.key;
  }
  return null;
}

String regionName(String id, String lang) => regionNames[id]?[lang] ?? id;

/// Highest alert level (3 red, 2 orange, 1 yellow, 0 none) per region.
Map<String, int> regionLevels(Map<int, int> wilayaLevels) {
  final out = {'est': 0, 'centre': 0, 'ouest': 0, 'sud': 0};
  for (final e in regionMembers.entries) {
    for (final code in e.value) {
      final l = wilayaLevels[code] ?? 0;
      if (l > out[e.key]!) out[e.key] = l;
    }
  }
  return out;
}

/// Count of wilayas at a given level within a region.
int regionCountAt(Map<int, int> wilayaLevels, String region, int level) =>
    regionMembers[region]!.where((c) => (wilayaLevels[c] ?? 0) == level).length;
