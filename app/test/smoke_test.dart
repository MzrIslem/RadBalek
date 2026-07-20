import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rad_balek/main.dart';
import 'package:rad_balek/src/app_state.dart';
import 'package:rad_balek/src/models.dart';

Snapshot fixture() => Snapshot.fromJson({
      'generatedAt': '2026-07-18T12:00:00Z',
      'stats': {
        'byColor': {'red': 2, 'orange': 5, 'yellow': 3},
        'byHazard': {'heat': 8, 'storm': 2},
        'dgpcSitrep': {'ongoing': 4},
      },
      'alerts': [
        {
          'id': 'a1',
          'source': 'onm',
          'hazard': 'heat',
          'color': 'red',
          'severity': 'Extreme',
          'onset': '2026-07-18T09:00:00Z',
          'expires': '2026-07-18T18:00:00Z',
          'wilayas': [
            {'code': 16, 'fr': 'Alger', 'ar': 'الجزائر'}
          ],
          'headline': {'fr': 'Canicule — rouge — Alger', 'ar': 'موجة حر', 'en': 'Heat'},
        },
        {
          'id': 'a2',
          'source': 'onm',
          'hazard': 'storm',
          'color': 'orange',
          'severity': 'Severe',
          'wilayas': [
            {'code': 6, 'fr': 'Béjaïa', 'ar': 'بجاية'}
          ],
          'headline': {'fr': 'Orages', 'ar': 'عواصف', 'en': 'Storms'},
        },
      ],
      'incidents': [
        {
          'id': 'i1',
          'source': 'dgpc-telegram',
          'hazard': 'fire',
          'status': 'ongoing',
          'wilayas': [
            {'code': 6, 'fr': 'Béjaïa', 'ar': 'بجاية'}
          ],
          'commune': 'Tichy',
        },
      ],
    });

void main() {
  testWidgets('home renders hero, KPIs and alert list from a snapshot', (tester) async {
    final st = AppState(autoRefresh: false);
    st.snapshot = fixture();
    st.wilayas = const [
      Wilaya(code: 16, fr: 'Alger', ar: 'الجزائر'),
      Wilaya(code: 6, fr: 'Béjaïa', ar: 'بجاية'),
    ];

    await tester.pumpWidget(RadBalekApp(state: st));
    await tester.pump();

    expect(find.text('Rad Balek'), findsOneWidget);
    expect(find.textContaining('Vigilance rouge'), findsWidgets); // hero + list entry
    expect(find.text('Wilayas en rouge'), findsOneWidget); // KPI tile label
    expect(find.textContaining('Canicule'), findsWidgets);
  });

  testWidgets('arabic mode flips to RTL', (tester) async {
    final st = AppState(autoRefresh: false);
    st.snapshot = fixture();
    st.lang = 'ar';

    await tester.pumpWidget(RadBalekApp(state: st));
    await tester.pump();

    expect(find.text('رد بالك'), findsOneWidget);
    final dir = Directionality.of(tester.element(find.text('رد بالك')));
    expect(dir, TextDirection.rtl);
  });
}
