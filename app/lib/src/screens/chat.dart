import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../ai.dart';
import '../app_state.dart';
import '../strings.dart';
import '../theme.dart';

/// Safety-scoped Gemini assistant (Firebase AI Logic). Grounded with the
/// user's current alerts; streams answers; always shows the call-14 escape.
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _Msg {
  final bool me;
  String text;
  _Msg(this.me, this.text);
}

class _ChatScreenState extends State<ChatScreen> {
  final _ctl = TextEditingController();
  final _scroll = ScrollController();
  final List<_Msg> _msgs = [];
  bool _busy = false;

  String _context(AppState st) {
    final snap = st.snapshot;
    if (snap == null) return 'No data loaded.';
    final myCodes = {...st.myWilayas, if (st.hereWilaya != null) st.hereWilaya!};
    final mine = snap.alerts.where((a) => a.wilayas.any((w) => myCodes.contains(w.code))).take(5);
    final b = StringBuffer();
    b.writeln('User wilayas: ${st.myWilayas.map(st.wilayaName).join(', ')}.');
    if (mine.isEmpty) {
      b.writeln('No active alert in the user\'s wilayas.');
    } else {
      b.writeln('Active alerts in user\'s wilayas:');
      for (final a in mine) {
        b.writeln('- ${a.hazard} ${a.color} in ${a.wilayas.map((w) => w.fr).join(", ")}.');
      }
    }
    b.writeln('National: ${snap.wilayasWith('red').length} wilayas red, ${snap.wilayasWith('orange').length} orange.');
    return b.toString();
  }

  Future<void> _send(String text) async {
    text = text.trim();
    if (text.isEmpty || _busy) return;
    final st = context.read<AppState>();
    // History (excluding the placeholder we're about to add) for the worker.
    final history = [
      for (final m in _msgs) {'role': m.me ? 'user' : 'model', 'text': m.text},
      {'role': 'user', 'text': text},
    ];
    setState(() {
      _msgs.add(_Msg(true, text));
      _msgs.add(_Msg(false, ''));
      _busy = true;
      _ctl.clear();
    });
    _jump();
    final reply = await Ai.chat(lang: st.lang, context: _context(st), messages: history);
    setState(() {
      _msgs.last.text = reply ?? S.t(st.lang, 'ai_err');
      _busy = false;
    });
    _jump();
  }

  void _jump() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    final starters = [S.t(lang, 'q_heat'), S.t(lang, 'q_flood'), S.t(lang, 'q_quake'), S.t(lang, 'q_num')];

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Image.asset('assets/logo.png', width: 26, height: 26),
          const SizedBox(width: 8),
          Text(S.t(lang, 'assistant')),
        ]),
        actions: [
          IconButton(
            tooltip: '14',
            onPressed: () => launchUrl(Uri.parse('tel:14')),
            icon: Icon(Icons.call, color: vigilance('red', st.dark).solid),
          ),
        ],
      ),
      body: Column(children: [
        Expanded(
          child: _msgs.isEmpty
              ? _empty(context, st, starters)
              : ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.all(14),
                  itemCount: _msgs.length,
                  itemBuilder: (ctx, i) => _bubble(context, st, _msgs[i], i == _msgs.length - 1 && _busy),
                ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 10),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _ctl,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: _send,
                  decoration: InputDecoration(
                    hintText: S.t(lang, 'ask_hint'),
                    filled: true,
                    fillColor: cs.surfaceContainerHigh,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _busy ? null : () => _send(_ctl.text),
                icon: const Icon(Icons.send),
              ),
            ]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Text(S.t(lang, 'ai_disclaimer'),
              textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant)),
        ),
      ]),
    );
  }

  Widget _empty(BuildContext context, AppState st, List<String> starters) {
    final cs = Theme.of(context).colorScheme;
    return ListView(padding: const EdgeInsets.all(20), children: [
      const SizedBox(height: 20),
      Opacity(opacity: .16, child: Center(child: Image.asset('assets/logo.png', width: 96, height: 96))),
      const SizedBox(height: 16),
      Center(child: Text(S.t(st.lang, 'ai_welcome'), textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant))),
      const SizedBox(height: 20),
      for (final q in starters)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: ActionChip(
            avatar: const Icon(Icons.chat_bubble_outline, size: 16),
            label: Text(q),
            onPressed: () => _send(q),
          ),
        ),
    ]);
  }

  Widget _bubble(BuildContext context, AppState st, _Msg m, bool typing) {
    final cs = Theme.of(context).colorScheme;
    return Align(
      alignment: m.me ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .82),
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: m.me ? cs.primary : cs.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          m.text.isEmpty && typing ? '…' : m.text,
          style: TextStyle(fontSize: 14, height: 1.4, color: m.me ? cs.onPrimary : cs.onSurface),
        ),
      ),
    );
  }
}
