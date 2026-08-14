import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api.dart';
import 'diag.dart';

/// AI via the Cloudflare worker (server-side Gemini, no App Check / Play
/// Integrity dependency — works on every install; key stays server-side).
class Ai {
  static const categories = ['fire', 'smoke', 'road', 'flood', 'animal', 'heat', 'other'];
  static final _c = http.Client();

  /// Chat turn: send the whole conversation + situation context, get a reply.
  /// messages: [{'role': 'user'|'model', 'text': ...}] oldest→newest.
  static Future<String?> chat({
    required String lang,
    required String context,
    required List<Map<String, String>> messages,
  }) async {
    try {
      final r = await _c
          .post(
            Uri.parse('${Api.base}/v1/ai/chat'),
            headers: {'content-type': 'application/json'},
            body: jsonEncode({'lang': lang, 'context': context, 'messages': messages}),
          )
          .timeout(const Duration(seconds: 30));
      if (r.statusCode != 200) {
        logErr('ai chat', 'HTTP ${r.statusCode}: ${utf8.decode(r.bodyBytes)}');
        return null;
      }
      final t = (jsonDecode(utf8.decode(r.bodyBytes)) as Map)['text'] as String?;
      return (t == null || t.trim().isEmpty) ? null : t.trim();
    } catch (err) {
      logErr('ai chat', err);
      return null;
    }
  }

  /// Suggest a report category from free text (Arabic / darija / French).
  static Future<String?> suggestCategory(String text) async {
    if (text.trim().length < 4) return null;
    try {
      final r = await _c
          .post(
            Uri.parse('${Api.base}/v1/ai/category'),
            headers: {'content-type': 'application/json'},
            body: jsonEncode({'text': text}),
          )
          .timeout(const Duration(seconds: 20));
      if (r.statusCode != 200) {
        logErr('ai category', 'HTTP ${r.statusCode}');
        return null;
      }
      final c = (jsonDecode(utf8.decode(r.bodyBytes)) as Map)['category'] as String?;
      return categories.contains(c) ? c : null;
    } catch (err) {
      logErr('ai category', err);
      return null;
    }
  }
}
