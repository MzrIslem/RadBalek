import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../strings.dart';

/// In-app feedback: users tell the maintainer about bugs, ideas, or give a
/// rating/review — without leaving the app or needing an account.
class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  String _type = 'comment';
  int _rating = 0;
  final _ctl = TextEditingController();
  bool _sending = false;
  bool _done = false;

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final st = context.read<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;

    if (_done) {
      return Scaffold(
        appBar: AppBar(title: Text(S.t(lang, 'feedback'))),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(30),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.favorite, size: 48, color: cs.primary),
              const SizedBox(height: 14),
              Text(S.t(lang, 'fb_thanks'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            ]),
          ),
        ),
      );
    }

    const types = [('bug', Icons.bug_report_outlined, 'fb_bug'),
      ('idea', Icons.lightbulb_outline, 'fb_idea'), ('comment', Icons.chat_bubble_outline, 'fb_comment')];

    return Scaffold(
      appBar: AppBar(title: Text(S.t(lang, 'feedback'))),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(S.t(lang, 'fb_intro'), style: TextStyle(fontSize: 14, height: 1.4, color: cs.onSurfaceVariant)),
          const SizedBox(height: 18),
          Wrap(spacing: 8, children: [
            for (final (id, icon, key) in types)
              ChoiceChip(
                avatar: Icon(icon, size: 17),
                label: Text(S.t(lang, key)),
                selected: _type == id,
                onSelected: (_) => setState(() => _type = id),
              ),
          ]),
          const SizedBox(height: 20),
          Text(S.t(lang, 'fb_rate'),
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, letterSpacing: .5, color: cs.onSurfaceVariant)),
          const SizedBox(height: 6),
          Row(children: [
            for (var i = 1; i <= 5; i++)
              IconButton(
                onPressed: () => setState(() => _rating = _rating == i ? 0 : i),
                icon: Icon(i <= _rating ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 34, color: i <= _rating ? Colors.amber : cs.outline),
              ),
          ]),
          const SizedBox(height: 12),
          TextField(
            controller: _ctl,
            maxLength: 600,
            maxLines: 5,
            onChanged: (_) => setState(() {}), // re-evaluate the send button
            decoration: InputDecoration(
              hintText: S.t(lang, 'fb_hint'),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: (_sending || (_ctl.text.trim().isEmpty && _rating == 0))
                ? null
                : () async {
                    final messenger = ScaffoldMessenger.of(context);
                    setState(() => _sending = true);
                    final ok = await st.sendFeedback(type: _type, rating: _rating == 0 ? null : _rating, text: _ctl.text.trim());
                    if (!mounted) return;
                    if (ok) {
                      setState(() => _done = true);
                    } else {
                      setState(() => _sending = false);
                      messenger.showSnackBar(SnackBar(content: Text(S.t(lang, 'rep_err'))));
                    }
                  },
            icon: _sending
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send),
            label: Text(S.t(lang, 'fb_send')),
          ),
        ],
      ),
    );
  }
}
