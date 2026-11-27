import 'package:flutter/material.dart';
import '../data/species_data.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';

class SpeciesScreen extends StatefulWidget {
  const SpeciesScreen({super.key});

  @override
  State<SpeciesScreen> createState() => _SpeciesScreenState();
}

class _SpeciesScreenState extends State<SpeciesScreen> {
  int _mode = 0; // 0 divulgative, 1 scientific
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final q = _search.text.trim().toLowerCase();
    final results = q.isEmpty
        ? <Species>[]
        : kSpecies.where((s) {
            final hay = '${s.names.join(' ')} ${s.sci} ${s.family}'.toLowerCase();
            return hay.contains(q);
          }).toList();

    return Column(
      children: [
        MiisTabs(
          labels: [app.t('guide.divulgative'), app.t('guide.scientific')],
          index: _mode,
          onChanged: (i) => setState(() => _mode = i),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            controller: _search,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: app.t('guide.search'),
              suffixIcon: _search.text.isEmpty
                  ? const Icon(Icons.search, color: MiisColors.muted)
                  : IconButton(
                      icon: const Icon(Icons.close, color: MiisColors.muted),
                      onPressed: () => setState(_search.clear),
                    ),
            ),
          ),
        ),
        Expanded(
          child: q.isNotEmpty
              ? (results.isEmpty
                  ? Center(child: Text(app.t('guide.noResults'), style: const TextStyle(color: MiisColors.muted)))
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
                      itemCount: results.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => SpeciesTile(species: results[i], scientific: _mode == 1),
                    ))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
                  itemCount: kSpeciesCategories.length + 1,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    if (i == kSpeciesCategories.length) {
                      return Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(app.t('guide.disclaimer'),
                            style: const TextStyle(fontSize: 11.5, color: MiisColors.faint, height: 1.4)),
                      );
                    }
                    final c = kSpeciesCategories[i];
                    final count = kSpecies.where((s) => s.category == c.id).length;
                    return MiisCard(
                      padding: EdgeInsets.zero,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => CategoryScreen(category: c, scientific: _mode == 1)),
                      ),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 92,
                            height: 82,
                            child: Image.asset(
                              c.image,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => Container(color: MiisColors.panelAlt, alignment: Alignment.center, child: Text(c.emoji, style: const TextStyle(fontSize: 30))),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(app.t(c.labelKey), style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700)),
                                const SizedBox(height: 3),
                                Text('$count ${app.t('guide.species')}', style: const TextStyle(color: MiisColors.muted, fontSize: 12.5)),
                              ],
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.only(right: 16),
                            child: Icon(Icons.arrow_forward, color: Colors.white),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class SpeciesTile extends StatelessWidget {
  final Species species;
  final bool scientific;
  const SpeciesTile({super.key, required this.species, required this.scientific});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return MiisCard(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => SpeciesDetailScreen(species: species))),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(species.name(app.lang), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 3),
                Text(
                  scientific ? species.sci : species.name(0),
                  style: TextStyle(
                    fontSize: 12.5,
                    color: MiisColors.muted,
                    fontStyle: scientific ? FontStyle.italic : FontStyle.normal,
                  ),
                ),
                const SizedBox(height: 8),
                MiisChip('${species.iucn} • ${app.t('iucn.${species.iucn}')}', color: iucnColor(species.iucn)),
              ],
            ),
          ),
          const SizedBox(width: 10),
          const Icon(Icons.arrow_forward, color: Colors.white),
        ],
      ),
    );
  }
}

class CategoryScreen extends StatelessWidget {
  final SpeciesCategory category;
  final bool scientific;
  const CategoryScreen({super.key, required this.category, required this.scientific});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final list = kSpecies.where((s) => s.category == category.id).toList();
    return Scaffold(
      appBar: AppBar(
        title: Text(app.t(category.labelKey), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: MiisColors.line)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        children: [
          SizedBox(
            height: 150,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Image.asset(
                category.image,
                fit: BoxFit.cover,
                width: double.infinity,
                errorBuilder: (_, _, _) => Container(color: MiisColors.panel),
              ),
            ),
          ),
          const SizedBox(height: 14),
          for (final s in list) ...[
            SpeciesTile(species: s, scientific: scientific),
            const SizedBox(height: 10),
          ],
          Text(app.t('guide.disclaimer'), style: const TextStyle(fontSize: 11.5, color: MiisColors.faint, height: 1.4)),
        ],
      ),
    );
  }
}

class SpeciesDetailScreen extends StatelessWidget {
  final Species species;
  const SpeciesDetailScreen({super.key, required this.species});

  Widget _row(String k, String v, {bool italic = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 128, child: Text(k, style: const TextStyle(color: MiisColors.faint, fontSize: 13))),
            Expanded(
              child: Text(v,
                  style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, fontStyle: italic ? FontStyle.italic : FontStyle.normal)),
            ),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Scaffold(
      appBar: AppBar(
        title: Text(species.name(app.lang), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: MiisColors.line)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        children: [
          Text(species.name(app.lang), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w400, height: 1.2)),
          const SizedBox(height: 4),
          Text(species.sci, style: const TextStyle(fontSize: 16, fontStyle: FontStyle.italic, color: MiisColors.muted)),
          const SizedBox(height: 14),
          MiisChip('${species.iucn} • ${app.t('iucn.${species.iucn}')}', color: iucnColor(species.iucn)),
          const SizedBox(height: 20),
          Text(app.t('guide.about'), style: const TextStyle(fontSize: 13, color: MiisColors.amber, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(species.description(app.lang), style: const TextStyle(fontSize: 15.5, height: 1.6, color: Color(0xE6FFFFFF))),
          const SizedBox(height: 22),
          MiisCard(
            child: Column(
              children: [
                _row(app.t('guide.names'), species.names.join(' • ')),
                const Divider(height: 1, color: MiisColors.line),
                _row(app.t('guide.sciName'), species.sci, italic: true),
                const Divider(height: 1, color: MiisColors.line),
                _row(app.t('guide.family'), species.family),
                const Divider(height: 1, color: MiisColors.line),
                _row(app.t('guide.order'), species.order),
                const Divider(height: 1, color: MiisColors.line),
                _row(app.t('guide.iucn'), '${species.iucn} — ${app.t('iucn.${species.iucn}')}'),
                const Divider(height: 1, color: MiisColors.line),
                _row(app.t('guide.note'), species.iucnNote),
              ],
            ),
          ),
          const SizedBox(height: 22),
          MiisButton(
            label: app.t('guide.reportThis'),
            icon: Icons.add_location_alt_outlined,
            trailingArrow: true,
            onPressed: () {
              Navigator.of(context).popUntil((r) => r.isFirst);
              app.prefill(species.reportTaxon);
            },
          ),
          const SizedBox(height: 14),
          Text(app.t('guide.disclaimer'), style: const TextStyle(fontSize: 11.5, color: MiisColors.faint, height: 1.4)),
        ],
      ),
    );
  }
}
