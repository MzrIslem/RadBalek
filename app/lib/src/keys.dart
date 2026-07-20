import 'package:flutter/material.dart';

/// Global messenger so background services (FCM foreground handler) can
/// surface banners without a BuildContext.
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();
