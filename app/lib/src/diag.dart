import 'package:flutter/foundation.dart';

/// Single sink for errors the app deliberately absorbs.
///
/// Most catches in this app are best-effort on purpose — a failed weather fetch
/// must never stop an alert from rendering. But a swallowed error with no trace
/// is indistinguishable from success, and a device that has silently stopped
/// receiving alerts looks exactly like a device with nothing to report. Every
/// caught error that is not surfaced to the user goes through here so it shows
/// up in `flutter logs` / logcat with the failing step named.
void logErr(String scope, Object err) => debugPrint('[rb] $scope: ${errText(err)}');

/// First line only: platform exceptions carry multi-line stack text that buries
/// the message in the log.
String errText(Object? err) => err == null ? 'unknown error' : err.toString().split('\n').first;

/// Set when `Firebase.initializeApp()` fails at startup. Without Firebase no
/// alert can ever ring, so [AppState] reports it in the push diagnostic instead
/// of booting up looking healthy.
String? firebaseInitError;
