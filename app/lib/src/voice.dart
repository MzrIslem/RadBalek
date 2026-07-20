import 'package:flutter_tts/flutter_tts.dart';
import 'models.dart';
import 'strings.dart';

/// Spoken red-alert announcements — on-device TTS, so it works offline and
/// fires instantly (a cloud voice would fail exactly when the network is
/// worst). Bilingual AR+FR (the Algerian household reality): the user's
/// language first, the other second. Arabic voice data isn't guaranteed on
/// every device — checked at speak time, silently falling back to French.
class VoiceAlert {
  static final FlutterTts _tts = FlutterTts();
  static bool _ready = false;
  static bool speaking = false;

  static Future<void> _init() async {
    if (_ready) return;
    // speak() resolves when the utterance finishes -> parts play in sequence.
    await _tts.awaitSpeakCompletion(true);
    await _tts.setSpeechRate(0.5); // calm, intelligible under stress
    await _tts.setVolume(1.0);
    _ready = true;
  }

  /// The wilaya to name aloud: the user's own if the alert touches it.
  static Wilaya _place(AlertItem a, Set<int> myCodes) {
    for (final w in a.wilayas) {
      if (myCodes.contains(w.code)) return w;
    }
    return a.wilayas.isNotEmpty
        ? a.wilayas.first
        : const Wilaya(code: 0, fr: 'Algérie', ar: 'الجزائر');
  }

  static Future<bool> _langOk(String code) async {
    try {
      return await _tts.isLanguageAvailable(code) == true;
    } catch (_) {
      return false;
    }
  }

  /// Speak the short red-alert message. Safe to call repeatedly — a replay
  /// restarts from the top.
  static Future<void> announce(AlertItem a, {required Set<int> myCodes, required String lang}) async {
    await _init();
    await _tts.stop();
    final w = _place(a, myCodes);
    final fr = 'Alerte rouge. ${S.t('fr', a.hazard)} à ${w.fr}. '
        "Suivez les consignes. En cas d'urgence, appelez le 14.";
    final ar = 'تحذير أحمر. ${S.t('ar', a.hazard)} في ولاية ${w.ar}. '
        'اتبعوا التعليمات. في حالة الطوارئ اتصلوا بالرقم 14.';
    // ar-DZ voices are rare; plain ar resolves to whatever Arabic voice exists.
    final arCode = await _langOk('ar-DZ') ? 'ar-DZ' : (await _langOk('ar') ? 'ar' : null);
    final parts = <(String, String)>[
      if (lang == 'ar' && arCode != null) (arCode, ar),
      ('fr-FR', fr),
      if (lang != 'ar' && arCode != null) (arCode, ar),
    ];
    speaking = true;
    try {
      for (final (code, msg) in parts) {
        if (!speaking) break; // stopped mid-announcement
        await _tts.setLanguage(code);
        await _tts.speak(msg);
      }
    } catch (_) {
      // TTS engine missing/broken: never let voice failure disturb the alert UI.
    } finally {
      speaking = false;
    }
  }

  static Future<void> stop() async {
    speaking = false;
    try {
      await _tts.stop();
    } catch (_) {}
  }

  /// Tap behavior on the red card's speaker button: speaking -> stop, else replay.
  static Future<void> toggle(AlertItem a, {required Set<int> myCodes, required String lang}) async {
    if (speaking) {
      await stop();
    } else {
      await announce(a, myCodes: myCodes, lang: lang);
    }
  }
}
