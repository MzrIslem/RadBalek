import 'package:url_launcher/url_launcher.dart';

/// Opens a link that came from the network — a press/DGPC feed item, or the
/// update banner published through /v1/admin/app-latest.
///
/// Those strings are handed straight to the platform launcher, so the scheme
/// has to be checked here: `javascript:`, `file:`, `content:` or an
/// Android `intent://` URL in a feed would otherwise let a compromised
/// upstream feed reach local files or other apps' components. Only https is
/// accepted (http is refused too — every source in the pipeline is https, and
/// a plain-http download of an APK is tamperable in transit).
Future<bool> openWebLink(String? raw) async {
  final url = raw == null ? null : Uri.tryParse(raw);
  if (url == null || url.scheme != 'https' || url.host.isEmpty) return false;
  return launchUrl(url, mode: LaunchMode.externalApplication);
}
