import 'package:flutter/material.dart';

/// Material 3 theme seeded on the brand teal, plus the vigilance palette
/// (container/on-container pairs per level, tuned for light and dark).
class RBTheme {
  static const seed = Color(0xFF006A60);

  // Cairo: geometric, renders Arabic + Latin with equal quality.
  static ThemeData light() => ThemeData(
        useMaterial3: true,
        fontFamily: 'Cairo',
        colorScheme: ColorScheme.fromSeed(seedColor: seed),
        fontFamilyFallback: const ['Noto Naskh Arabic', 'Segoe UI', 'Noto Sans'],
      );

  static ThemeData dark() => ThemeData(
        useMaterial3: true,
        fontFamily: 'Cairo',
        colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark),
        fontFamilyFallback: const ['Noto Naskh Arabic', 'Segoe UI', 'Noto Sans'],
      );
}

class Vigilance {
  final Color container;
  final Color onContainer;
  final Color solid;
  const Vigilance(this.container, this.onContainer, this.solid);
}

Vigilance vigilance(String color, bool dark) {
  switch (color) {
    case 'red':
      return dark
          ? const Vigilance(Color(0xFF7B1712), Color(0xFFFFDAD6), Color(0xFFFFB4AB))
          : const Vigilance(Color(0xFFFFDAD6), Color(0xFF73100E), Color(0xFFBA1A1A));
    case 'orange':
      return dark
          ? const Vigilance(Color(0xFF6B3200), Color(0xFFFFDCC2), Color(0xFFFFB77C))
          : const Vigilance(Color(0xFFFFDCC2), Color(0xFF5C2A00), Color(0xFF964900));
    case 'yellow':
      return dark
          ? const Vigilance(Color(0xFF524800), Color(0xFFF0E395), Color(0xFFDCC94B))
          : const Vigilance(Color(0xFFF0E395), Color(0xFF494000), Color(0xFF6D5E00));
    case 'green':
      return dark
          ? const Vigilance(Color(0xFF1D5430), Color(0xFFC9EFCF), Color(0xFF8FD69B))
          : const Vigilance(Color(0xFFC9EFCF), Color(0xFF0E4523), Color(0xFF1D6E37));
    default:
      return dark
          ? const Vigilance(Color(0xFF232A28), Color(0xFFBEC9C5), Color(0xFF89938F))
          : const Vigilance(Color(0xFFE2E9E6), Color(0xFF3F4946), Color(0xFF6F7976));
  }
}

const hazardIcons = <String, IconData>{
  'heat': Icons.thermostat,
  'storm': Icons.thunderstorm_outlined,
  'wind': Icons.air,
  'sandstorm': Icons.waves,
  'flood': Icons.water_outlined,
  'cold': Icons.ac_unit,
  'fire': Icons.local_fire_department_outlined,
  'road': Icons.directions_car_outlined,
  'sat': Icons.satellite_alt_outlined,
  'quake': Icons.vibration,
  'other': Icons.info_outline,
};

const categoryIcons = <String, IconData>{
  'fire': Icons.local_fire_department_outlined,
  'smoke': Icons.waves,
  'road': Icons.directions_car_outlined,
  'flood': Icons.water_outlined,
  'animal': Icons.pets_outlined,
  'heat': Icons.thermostat,
  'other': Icons.info_outline,
};

IconData hazardIcon(String h) => hazardIcons[h] ?? Icons.info_outline;
