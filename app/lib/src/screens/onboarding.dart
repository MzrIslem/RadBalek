import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../strings.dart';
import '../theme.dart';

/// First-run flow: language -> wilayas -> how alerts work.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _ctl = PageController();
  int _page = 0;

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;

    Widget header(IconData icon, String title) => Column(children: [
          const SizedBox(height: 40),
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(color: cs.primary, borderRadius: BorderRadius.circular(24)),
            child: Icon(icon, color: cs.onPrimary, size: 36),
          ),
          const SizedBox(height: 18),
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
          const SizedBox(height: 18),
        ]);

    final pages = [
      // 1 — language
      ListView(padding: const EdgeInsets.all(24), children: [
        header(Icons.translate, S.t(lang, 'onb_lang')),
        for (final (code, label) in const [('fr', 'Français'), ('ar', 'العربية'), ('en', 'English')])
          Card.filled(
            color: lang == code ? cs.primaryContainer : cs.surfaceContainerLow,
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              title: Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              trailing: lang == code ? const Icon(Icons.check_circle) : null,
              onTap: () => st.setLang(code),
            ),
          ),
      ]),
      // 2 — wilayas
      Column(children: [
        Expanded(
          child: ListView(padding: const EdgeInsets.all(24), children: [
            header(Icons.place_outlined, S.t(lang, 'onb_wil')),
            Wrap(spacing: 7, runSpacing: 7, children: [
              for (final w in st.wilayas)
                FilterChip(
                  label: Text('${w.code} ${w.name(lang)}', style: const TextStyle(fontSize: 11.5)),
                  selected: st.myWilayas.contains(w.code),
                  onSelected: (_) => st.toggleWilaya(w.code),
                ),
            ]),
          ]),
        ),
      ]),
      // 3 — how it works
      ListView(padding: const EdgeInsets.all(24), children: [
        header(Icons.shield_outlined, S.t(lang, 'onb_expl')),
        for (final c in const ['yellow', 'orange', 'red'])
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: vigilance(c, st.dark).container, borderRadius: BorderRadius.circular(16)),
            child: Row(children: [
              Container(
                  width: 14,
                  height: 14,
                  decoration:
                      BoxDecoration(color: vigilance(c, st.dark).solid, borderRadius: BorderRadius.circular(5))),
              const SizedBox(width: 10),
              Text(S.t(lang, c),
                  style: TextStyle(fontWeight: FontWeight.w700, color: vigilance(c, st.dark).onContainer)),
            ]),
          ),
        const SizedBox(height: 6),
        Text(S.t(lang, 'onb_expl_txt'), style: TextStyle(fontSize: 14, height: 1.6, color: cs.onSurfaceVariant)),
        const SizedBox(height: 10),
        Text(S.t(lang, 'disclaimer'), style: TextStyle(fontSize: 11.5, color: cs.onSurfaceVariant)),
      ]),
    ];

    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          Expanded(
            child: PageView(controller: _ctl, onPageChanged: (i) => setState(() => _page = i), children: pages),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 6, 24, 18),
            child: Row(children: [
              for (int i = 0; i < 3; i++)
                Container(
                  width: _page == i ? 22 : 8,
                  height: 8,
                  margin: const EdgeInsetsDirectional.only(end: 5),
                  decoration: BoxDecoration(
                      color: _page == i ? cs.primary : cs.outlineVariant, borderRadius: BorderRadius.circular(99)),
                ),
              const Spacer(),
              FilledButton(
                onPressed: () {
                  if (_page < 2) {
                    _ctl.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
                  } else {
                    st.finishOnboarding();
                  }
                },
                child: Text(_page < 2 ? '→' : S.t(lang, 'onb_done')),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}
