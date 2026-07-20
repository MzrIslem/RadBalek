import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api.dart';
import '../app_state.dart';
import '../strings.dart';
import '../theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;

    // Colored group label + rounded card (BMKG-inspired grouped layout).
    Widget section(String label, Color accent, Widget child) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(6, 4, 6, 8),
              child: Text(label.toUpperCase(),
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .6, color: accent)),
            ),
            Card.filled(
              color: cs.surfaceContainerLow,
              margin: const EdgeInsets.only(bottom: 18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(padding: const EdgeInsets.all(14), child: child),
            ),
          ],
        );

    Widget navRow(IconData icon, String title, String sub, VoidCallback onTap) => InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
            child: Row(children: [
              Icon(icon, size: 20, color: cs.primary),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                  if (sub.isNotEmpty)
                    Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ]),
              ),
              Icon(Icons.chevron_right, size: 20, color: cs.outline),
            ]),
          ),
        );

    final divider = Divider(height: 1, color: cs.outlineVariant);
    final langLabel = {'fr': 'Français', 'ar': 'العربية', 'en': 'English'}[lang]!;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              // --- Profil & zone ---
              section(S.t(lang, 'sec_profile'), cs.primary, Column(children: [
                navRow(Icons.translate, S.t(lang, 'set_lang'), langLabel, () => _pickLang(context, st)),
                divider,
                navRow(Icons.place_outlined, S.t(lang, 'set_wilayas'),
                    st.myWilayas.map(st.wilayaName).take(3).join(', '), () => _pickWilaya(context, st)),
                divider,
                SwitchListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                  secondary: Icon(Icons.my_location, size: 20, color: cs.primary),
                  title: Text(S.t(lang, 'follow'), style: const TextStyle(fontSize: 13.5)),
                  value: st.followMe,
                  onChanged: (_) => st.toggleFollow(),
                ),
              ])),
              // --- Alertes ---
              section(S.t(lang, 'nav_alerts'), vigilance('orange', st.dark).solid, Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Padding(padding: const EdgeInsets.only(left: 4, bottom: 8),
                    child: Text(S.t(lang, 'set_notif'), style: TextStyle(fontSize: 11.5, color: cs.onSurfaceVariant))),
                Wrap(spacing: 7, runSpacing: 7, children: [
                  for (final h in const ['heat', 'fire', 'flood', 'quake', 'storm', 'wind', 'sandstorm', 'road'])
                    FilterChip(
                      showCheckmark: false,
                      avatar: Icon(hazardIcon(h), size: 15),
                      label: Text(S.t(lang, h), style: const TextStyle(fontSize: 11.5)),
                      selected: st.notif[h] ?? true,
                      onSelected: (_) => st.toggleNotif(h),
                    ),
                ]),
                const SizedBox(height: 10),
                Text('${S.t(lang, 'set_notif_note')} ${S.t(lang, 'quiet_note')}',
                    style: TextStyle(fontSize: 10.5, color: cs.onSurfaceVariant)),
                if (!kIsWeb) ...[
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    OutlinedButton.icon(
                      onPressed: () => _openChannel('emergency_s2'),
                      icon: const Icon(Icons.volume_up_outlined, size: 16),
                      label: Text(S.t(lang, 'ch_red'), style: const TextStyle(fontSize: 11.5)),
                    ),
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(S.t(lang, 'test_sending'))));
                        final res = await st.sendTestPush();
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).hideCurrentSnackBar();
                        if (res == 'ok') {
                          ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(S.t(lang, 'test_ok'))));
                        } else if (res == 'no-permission') {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(S.t(lang, 'test_noperm')),
                            action: SnackBarAction(label: S.t(lang, 'open'), onPressed: st.openAppNotifSettings),
                            duration: const Duration(seconds: 8),
                          ));
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text('${S.t(lang, 'test_fail')} ($res)'),
                            duration: const Duration(seconds: 6),
                          ));
                        }
                      },
                      icon: const Icon(Icons.notification_add_outlined, size: 16),
                      label: Text(S.t(lang, 'test_btn'), style: const TextStyle(fontSize: 11.5)),
                    ),
                  ]),
                ],
              ])),
              // --- Mode urgence (DND/silent bypass + voice announcements) ---
              if (!kIsWeb)
                section(S.t(lang, 'sec_emergency'), vigilance('red', st.dark).solid, Column(children: [
                  _EmergencyCard(),
                  const SizedBox(height: 6),
                  divider,
                  SwitchListTile(
                    dense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                    secondary: Icon(Icons.campaign_outlined, size: 20, color: vigilance('red', st.dark).solid),
                    title: Text(S.t(lang, 'voice_toggle'), style: const TextStyle(fontSize: 13.5)),
                    subtitle: Text(S.t(lang, 'voice_note'),
                        style: TextStyle(fontSize: 10.5, color: cs.onSurfaceVariant)),
                    value: st.voiceAlerts,
                    onChanged: (_) => st.toggleVoice(),
                  ),
                ])),
              // --- Contacts d'urgence ---
              section(S.t(lang, 'set_emerg'), vigilance('red', st.dark).solid, Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _SosEditor(),
                const SizedBox(height: 8),
                divider,
                const SizedBox(height: 8),
                Padding(padding: const EdgeInsets.only(left: 4, bottom: 6),
                    child: Text(S.t(lang, 'fam_title'), style: TextStyle(fontSize: 11.5, color: cs.onSurfaceVariant))),
                _FamilyEditor(),
              ])),
              // --- À propos ---
              section(S.t(lang, 'set_about'), cs.onSurfaceVariant, Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(S.t(lang, 'about_txt'), style: TextStyle(fontSize: 12.5, height: 1.5, color: cs.onSurfaceVariant)),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () => launchUrl(Uri.parse('${Api.base}/v1/reports.csv'), mode: LaunchMode.externalApplication),
                  icon: const Icon(Icons.download_outlined, size: 17),
                  label: Text(S.t(lang, 'export_csv'), style: const TextStyle(fontSize: 12.5)),
                ),
              ])),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
                child: Text(S.t(lang, 'disclaimer'),
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
              ),
            ]),
          ),
        ),
      ],
    );
  }

  void _pickLang(BuildContext context, AppState st) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => Column(mainAxisSize: MainAxisSize.min, children: [
        for (final (code, label) in const [('fr', 'Français'), ('ar', 'العربية'), ('en', 'English')])
          ListTile(
            title: Text(label),
            trailing: st.lang == code ? const Icon(Icons.check) : null,
            onTap: () {
              st.setLang(code);
              Navigator.pop(ctx);
            },
          ),
        const SizedBox(height: 12),
      ]),
    );
  }

  static const _ch = MethodChannel('rb/channels');

  // (family editor is a separate stateful widget below)

  Future<void> _openChannel(String id) async {
    try {
      await _ch.invokeMethod('openChannel', {'id': id});
    } catch (_) {}
  }

  // Compact searchable multi-select picker instead of a 58-chip wall.
  void _pickWilaya(BuildContext context, AppState st) {
    String q = '';
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) {
          final lang = st.lang;
          final items = st.wilayas
              .where((w) => q.isEmpty || w.fr.toLowerCase().contains(q.toLowerCase()) || w.ar.contains(q) || '${w.code}'.contains(q))
              .toList();
          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: .7,
            builder: (ctx, ctl) => Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: TextField(
                  autofocus: true,
                  onChanged: (v) => setSt(() => q = v),
                  decoration: InputDecoration(
                    hintText: S.t(lang, 'search'),
                    prefixIcon: const Icon(Icons.search),
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              Expanded(
                child: ListView.builder(
                  controller: ctl,
                  itemCount: items.length,
                  itemBuilder: (ctx, i) {
                    final w = items[i];
                    final sel = st.myWilayas.contains(w.code);
                    return CheckboxListTile(
                      dense: true,
                      value: sel,
                      title: Text('${w.code} — ${w.name(lang)}', style: const TextStyle(fontSize: 14)),
                      onChanged: (_) => setSt(() => st.toggleWilaya(w.code)),
                    );
                  },
                ),
              ),
            ]),
          );
        },
      ),
    );
  }


}

class _FamilyEditor extends StatefulWidget {
  @override
  State<_FamilyEditor> createState() => _FamilyEditorState();
}

class _FamilyEditorState extends State<_FamilyEditor> {
  final _ctl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Wrap(spacing: 7, runSpacing: 7, children: [
        for (final n in st.family)
          InputChip(
            avatar: st.nameFor(n) != null ? const Icon(Icons.person, size: 15) : null,
            label: Text(st.nameFor(n) ?? n),
            onDeleted: () => st.removeFamily(n),
          ),
      ]),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(
          child: TextField(
            controller: _ctl,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              hintText: S.t(lang, 'fam_hint'),
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(width: 8),
        FilledButton.tonal(
          onPressed: () {
            st.addFamily(_ctl.text);
            _ctl.clear();
          },
          child: const Icon(Icons.add, size: 20),
        ),
      ]),
      const SizedBox(height: 6),
      // Pick straight from the phone's address book (no typing, no permission).
      OutlinedButton.icon(
        onPressed: () async {
          final c = await st.pickContact();
          if (c != null) st.addFamily(c.number, name: c.name);
        },
        icon: const Icon(Icons.contacts_outlined, size: 16),
        label: Text(S.t(lang, 'pick_contact'), style: const TextStyle(fontSize: 11.5)),
      ),
      const SizedBox(height: 6),
      Text(S.t(lang, 'fam_note'), style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
    ]);
  }
}

class _SosEditor extends StatefulWidget {
  @override
  State<_SosEditor> createState() => _SosEditorState();
}

class _SosEditorState extends State<_SosEditor> {
  final _ctl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Wrap(spacing: 7, runSpacing: 7, children: [
        for (final n in st.sosNumbers)
          InputChip(
            avatar: const Icon(Icons.call, size: 15),
            label: Text(st.nameFor(n) != null ? '${st.nameFor(n)} · $n' : n,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            onPressed: () => st.directCall(n),
            onDeleted: st.sosNumbers.length > 1 ? () => st.removeSos(n) : null,
          ),
      ]),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(
          child: TextField(
            controller: _ctl,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              hintText: S.t(lang, 'sos_add'),
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(width: 8),
        FilledButton.tonal(
          onPressed: () {
            st.addSos(_ctl.text);
            _ctl.clear();
          },
          child: const Icon(Icons.add, size: 20),
        ),
      ]),
      const SizedBox(height: 6),
      OutlinedButton.icon(
        onPressed: () async {
          final c = await st.pickContact();
          if (c != null) st.addSos(c.number, name: c.name);
        },
        icon: const Icon(Icons.contacts_outlined, size: 16),
        label: Text(S.t(lang, 'pick_contact'), style: const TextStyle(fontSize: 11.5)),
      ),
      const SizedBox(height: 6),
      Text('14 · 1021 Protection Civile — 17 Police — 1055 Gendarmerie',
          style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
    ]);
  }
}

class _EmergencyCard extends StatefulWidget {
  @override
  State<_EmergencyCard> createState() => _EmergencyCardState();
}

class _EmergencyCardState extends State<_EmergencyCard> with WidgetsBindingObserver {
  Map<String, bool> _s = const {'dnd': false, 'battery': false};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState st) {
    if (st == AppLifecycleState.resumed) _refresh();
  }

  Future<void> _refresh() async {
    final st = context.read<AppState>();
    final s = await st.emergencyStatus();
    if (mounted) setState(() => _s = s);
  }

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    final green = vigilance('green', st.dark).solid;
    final red = vigilance('red', st.dark).solid;

    Widget row(String label, bool on, IconData icon, Future<void> Function() onTap) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(children: [
            Icon(icon, size: 20, color: on ? green : red),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
            on
                ? Text(S.t(lang, 'emg_on'), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: green))
                : FilledButton.tonal(
                    onPressed: () async {
                      await onTap();
                    },
                    style: FilledButton.styleFrom(visualDensity: VisualDensity.compact),
                    child: Text(S.t(lang, 'emg_off'), style: const TextStyle(fontSize: 12)),
                  ),
          ]),
        );

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(S.t(lang, 'emg_intro'), style: TextStyle(fontSize: 11.5, height: 1.5, color: cs.onSurfaceVariant)),
      const SizedBox(height: 8),
      row(S.t(lang, 'emg_dnd'), _s['dnd'] ?? false, Icons.do_not_disturb_on_outlined, st.requestDndAccess),
      row(S.t(lang, 'emg_batt'), _s['battery'] ?? false, Icons.battery_saver_outlined, st.requestBatteryExempt),
    ]);
  }
}
