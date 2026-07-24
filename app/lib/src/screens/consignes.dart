import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../strings.dart';
import '../theme.dart';

/// Offline safety guides — the right reflexes per hazard, bundled in the app so
/// they work with **zero network** (which is exactly when a disaster cuts data).
/// Content is Protection-Civile-style advice, trilingual (fr/en/ar).
class ConsignesScreen extends StatelessWidget {
  final String? focusHazard;
  const ConsignesScreen({super.key, this.focusHazard});

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(S.t(lang, 'consignes'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          Text(S.t(lang, 'consignes_intro'),
              style: TextStyle(fontSize: 13, height: 1.5, color: cs.onSurfaceVariant)),
          const SizedBox(height: 14),
          for (final g in _guides)
            _GuideCard(guide: g, lang: lang, dark: st.dark, initiallyOpen: g.hazard == focusHazard),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(16)),
            child: Row(children: [
              Icon(Icons.call, size: 20, color: vigilance('red', st.dark).solid),
              const SizedBox(width: 12),
              Expanded(
                child: Text('14 · 1021 Protection Civile — 17 Police — 1055 Gendarmerie',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: cs.onSurface)),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}

class _GuideCard extends StatelessWidget {
  final _Guide guide;
  final String lang;
  final bool dark;
  final bool initiallyOpen;
  const _GuideCard({required this.guide, required this.lang, required this.dark, required this.initiallyOpen});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tint = guide.tint(dark);
    final sections = guide.l[lang] ?? guide.l['fr']!;
    return Card.filled(
      color: cs.surfaceContainerLow,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Theme(
        // Kill the default ExpansionTile dividers for a cleaner card.
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: initiallyOpen,
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: tint.withValues(alpha: .16), borderRadius: BorderRadius.circular(12)),
            child: Icon(guide.icon, color: tint, size: 22),
          ),
          title: Text(S.t(lang, guide.hazard),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          children: [
            for (final sec in sections)
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Padding(
                  padding: const EdgeInsets.only(top: 4, bottom: 6),
                  child: Text(sec.title.toUpperCase(),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: .5, color: tint)),
                ),
                for (final step in sec.steps)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 7),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Container(width: 6, height: 6,
                            decoration: BoxDecoration(color: tint, shape: BoxShape.circle)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(step,
                            style: TextStyle(fontSize: 13.5, height: 1.4, color: cs.onSurface)),
                      ),
                    ]),
                  ),
                const SizedBox(height: 6),
              ]),
          ],
        ),
      ),
    );
  }
}

class _Sec {
  final String title;
  final List<String> steps;
  const _Sec(this.title, this.steps);
}

class _Guide {
  final String hazard; // matches S.t hazard key + hazardIcon
  final IconData icon;
  final Color Function(bool dark) tint;
  final Map<String, List<_Sec>> l;
  const _Guide(this.hazard, this.icon, this.tint, this.l);
}

Color _red(bool d) => vigilance('red', d).solid;
Color _org(bool d) => vigilance('orange', d).solid;
Color _blue(bool d) => d ? const Color(0xFF7FB2FF) : const Color(0xFF1565C0);
Color _slate(bool d) => d ? const Color(0xFFB0BEC5) : const Color(0xFF546E7A);
Color _violet(bool d) => d ? const Color(0xFFC9A7FF) : const Color(0xFF6A3FB5);

const _guides = <_Guide>[
  // ── Earthquake ───────────────────────────────────────────────────────────
  _Guide('quake', Icons.crisis_alert_outlined, _slate, {
    'fr': [
      _Sec('Pendant la secousse', [
        'Se baisser, s’abriter sous une table solide, et s’y agripper.',
        'Rester loin des fenêtres, miroirs et meubles hauts.',
        'Ne pas courir dehors pendant les secousses.',
        'Dehors : gagner un espace dégagé, loin des murs et des câbles.',
        'En voiture : s’arrêter loin des ponts et immeubles.',
      ]),
      _Sec('Après', [
        'Couper le gaz et l’électricité en cas d’odeur ou de dégâts.',
        'Sortir calmement par les escaliers — jamais l’ascenseur.',
        'S’éloigner des bâtiments : attention aux répliques.',
        'Ne pas rentrer dans un bâtiment fissuré.',
      ]),
    ],
    'en': [
      _Sec('During the shaking', [
        'Drop, take cover under a sturdy table, and hold on.',
        'Stay away from windows, mirrors and tall furniture.',
        'Do not run outside while it is shaking.',
        'Outdoors: move to an open space, away from walls and cables.',
        'In a car: stop away from bridges and buildings.',
      ]),
      _Sec('Afterwards', [
        'Shut off gas and electricity if you smell gas or see damage.',
        'Leave calmly by the stairs — never the lift.',
        'Move away from buildings: beware of aftershocks.',
        'Do not go back into a cracked building.',
      ]),
    ],
    'ar': [
      _Sec('أثناء الهزّة', [
        'انبطح، احتمِ تحت طاولة متينة، وتشبّث بها.',
        'ابتعد عن النوافذ والمرايا والأثاث المرتفع.',
        'لا تركض إلى الخارج أثناء الهزّات.',
        'في الخارج: اتجه إلى مكان مكشوف، بعيدًا عن الجدران والأسلاك.',
        'في السيارة: توقّف بعيدًا عن الجسور والمباني.',
      ]),
      _Sec('بعد الهزّة', [
        'اقطع الغاز والكهرباء عند وجود رائحة أو أضرار.',
        'اخرج بهدوء عبر الدرج — لا تستعمل المصعد أبدًا.',
        'ابتعد عن المباني: احذر الهزّات الارتدادية.',
        'لا تدخل مبنى متصدّعًا.',
      ]),
    ],
  }),
  // ── Wildfire ─────────────────────────────────────────────────────────────
  _Guide('fire', Icons.local_fire_department_outlined, _red, {
    'fr': [
      _Sec('Si le feu approche', [
        'Fuir tôt, dans la direction opposée au vent et à la fumée.',
        'Appeler le 14 et signaler votre position précise.',
        'Fermer portes, fenêtres et volets ; arroser les abords si vous avez le temps.',
        'Se couvrir le nez et la bouche avec un linge humide.',
      ]),
      _Sec('En voiture', [
        'Phares allumés, vitres fermées, ventilation coupée.',
        'Ne pas traverser une fumée épaisse.',
      ]),
    ],
    'en': [
      _Sec('If the fire approaches', [
        'Leave early, in the direction opposite to the wind and smoke.',
        'Call 14 and give your exact location.',
        'Close doors, windows and shutters; wet the surroundings if you have time.',
        'Cover your nose and mouth with a damp cloth.',
      ]),
      _Sec('In a car', [
        'Headlights on, windows closed, ventilation off.',
        'Do not drive through thick smoke.',
      ]),
    ],
    'ar': [
      _Sec('إذا اقترب الحريق', [
        'غادر مبكرًا، في الاتجاه المعاكس للريح والدخان.',
        'اتصل بالرقم 14 وحدّد موقعك بدقة.',
        'أغلق الأبواب والنوافذ والمصاريع؛ وبلّل المحيط إن كان لديك وقت.',
        'غطِّ أنفك وفمك بقطعة قماش مبلّلة.',
      ]),
      _Sec('في السيارة', [
        'أضواء مشتعلة، نوافذ مغلقة، تهوية مقطوعة.',
        'لا تعبر الدخان الكثيف.',
      ]),
    ],
  }),
  // ── Flood ────────────────────────────────────────────────────────────────
  _Guide('flood', Icons.water_drop_outlined, _blue, {
    'fr': [
      _Sec('La règle d’or', [
        'Ne jamais s’engager dans un oued ou une route inondée, à pied ou en voiture.',
        '30 cm d’eau suffisent à emporter une voiture.',
        'Gagner immédiatement un point haut.',
      ]),
      _Sec('Pendant', [
        'Couper l’électricité.',
        'Ne pas descendre dans les sous-sols ni les caves.',
        'S’éloigner des cours d’eau et des ponts.',
        'Suivre le 14 et les consignes officielles, pas les rumeurs.',
      ]),
    ],
    'en': [
      _Sec('The golden rule', [
        'Never enter a wadi or a flooded road, on foot or by car.',
        '30 cm of water is enough to sweep away a car.',
        'Move to high ground immediately.',
      ]),
      _Sec('During', [
        'Switch off the electricity.',
        'Do not go into basements or cellars.',
        'Stay away from watercourses and bridges.',
        'Follow 14 and official instructions, not rumours.',
      ]),
    ],
    'ar': [
      _Sec('القاعدة الذهبية', [
        'لا تدخل أبدًا واديًا أو طريقًا غارقًا، سيرًا أو بالسيارة.',
        '30 سم من الماء تكفي لجرف سيارة.',
        'اتجه فورًا إلى مكان مرتفع.',
      ]),
      _Sec('أثناء الفيضان', [
        'اقطع الكهرباء.',
        'لا تنزل إلى الطوابق السفلية أو الأقبية.',
        'ابتعد عن مجاري المياه والجسور.',
        'اتبع الرقم 14 والتعليمات الرسمية، لا الإشاعات.',
      ]),
    ],
  }),
  // ── Heatwave ─────────────────────────────────────────────────────────────
  _Guide('heat', Icons.thermostat_outlined, _org, {
    'fr': [
      _Sec('Se protéger', [
        'Boire de l’eau régulièrement, sans attendre d’avoir soif.',
        'Rester au frais et à l’ombre entre 11 h et 17 h.',
        'Fermer les volets le jour, aérer la nuit.',
        'Se rafraîchir : linge humide, douches fraîches.',
      ]),
      _Sec('Protéger les autres', [
        'Ne jamais laisser un enfant ou une personne âgée dans une voiture.',
        'Prendre des nouvelles des personnes âgées, nourrissons et malades.',
      ]),
    ],
    'en': [
      _Sec('Protect yourself', [
        'Drink water regularly, before you feel thirsty.',
        'Stay cool and in the shade between 11 am and 5 pm.',
        'Close shutters by day, ventilate at night.',
        'Cool down: damp cloth, cool showers.',
      ]),
      _Sec('Protect others', [
        'Never leave a child or an elderly person in a car.',
        'Check on the elderly, infants and the sick.',
      ]),
    ],
    'ar': [
      _Sec('احمِ نفسك', [
        'اشرب الماء بانتظام، قبل أن تشعر بالعطش.',
        'ابقَ في مكان بارد وفي الظل بين الساعة 11 و17.',
        'أغلق المصاريع نهارًا، وهوِّ المكان ليلًا.',
        'انتعش: قماش مبلّل، حمّامات باردة.',
      ]),
      _Sec('احمِ الآخرين', [
        'لا تترك طفلًا أو مسنًّا في السيارة أبدًا.',
        'اطمئن على المسنّين والرضّع والمرضى.',
      ]),
    ],
  }),
  // ── Storm / high wind ────────────────────────────────────────────────────
  _Guide('storm', Icons.thunderstorm_outlined, _violet, {
    'fr': [
      _Sec('À l’intérieur', [
        'Débrancher les appareils électriques sensibles.',
        'Éviter le téléphone filaire pendant l’orage.',
        'Ranger ou attacher les objets qui peuvent s’envoler.',
      ]),
      _Sec('Dehors', [
        'Ne pas s’abriter sous un arbre.',
        'Éviter les déplacements ; rester loin des lignes électriques tombées.',
      ]),
    ],
    'en': [
      _Sec('Indoors', [
        'Unplug sensitive electrical appliances.',
        'Avoid corded phones during the storm.',
        'Secure or tie down objects that could blow away.',
      ]),
      _Sec('Outdoors', [
        'Do not shelter under a tree.',
        'Avoid travel; stay away from fallen power lines.',
      ]),
    ],
    'ar': [
      _Sec('في الداخل', [
        'افصل الأجهزة الكهربائية الحسّاسة.',
        'تجنّب الهاتف السلكي أثناء العاصفة.',
        'ثبّت أو اربط الأشياء التي قد تطير.',
      ]),
      _Sec('في الخارج', [
        'لا تحتمِ تحت شجرة.',
        'تجنّب التنقّل؛ وابقَ بعيدًا عن خطوط الكهرباء الساقطة.',
      ]),
    ],
  }),
];
