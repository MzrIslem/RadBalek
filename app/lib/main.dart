import 'dart:ui' as ui;
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'src/app_state.dart';
import 'src/diag.dart';
import 'src/keys.dart';
import 'src/screens/shell.dart';
import 'src/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb) {
    // Firebase Messaging (FCM) only. AI runs server-side via the worker, so no
    // App Check / Play Integrity is needed. Android reads google-services.json.
    try {
      await Firebase.initializeApp();
    } catch (err) {
      // Kept non-fatal (the maps, reports and cached snapshot still work), but
      // recorded: this is the single failure that silences every alert, and it
      // used to leave the app looking perfectly healthy.
      logErr('firebase init', err);
      firebaseInitError = errText(err);
    }
  }
  runApp(const RadBalekApp());
}

class RadBalekApp extends StatelessWidget {
  final AppState? state; // injectable for tests
  const RadBalekApp({super.key, this.state});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AppState>(
      create: (_) {
        final st = state ?? AppState();
        if (state == null) st.init();
        return st;
      },
      child: Consumer<AppState>(
        builder: (ctx, st, _) => MaterialApp(
          title: 'Rad Balek رد بالك',
          scaffoldMessengerKey: scaffoldMessengerKey,
          debugShowCheckedModeBanner: false,
          theme: RBTheme.light(),
          darkTheme: RBTheme.dark(),
          themeMode: st.dark ? ThemeMode.dark : ThemeMode.light,
          builder: (ctx, child) {
            // "Texte grand": scales on top of the OS setting rather than
            // replacing it, so a user who already enlarged system text keeps
            // that and gets more. Clamped at 1.6 — beyond that the emergency
            // cells and the red takeover start clipping.
            final osScale = MediaQuery.textScalerOf(ctx).scale(14) / 14;
            final scale = (osScale * (st.bigText ? 1.3 : 1.0)).clamp(0.85, 1.6);
            return MediaQuery.withClampedTextScaling(
              minScaleFactor: scale,
              maxScaleFactor: scale,
              child: Directionality(
                textDirection: st.rtl ? ui.TextDirection.rtl : ui.TextDirection.ltr,
                child: child ?? const SizedBox.shrink(),
              ),
            );
          },
          home: const Shell(),
        ),
      ),
    );
  }
}
