# SVG Technology Spanish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Générer les trois variantes SVG « Más de 360 máquinas » nécessaires à l'animation Webflow de la home espagnole.

**Architecture:** Le SVG fourni devient la variante de masque de référence. Un script de génération temporaire extrait son unique tracé composé pour produire la variante visible par inversion de luminance, tandis que la variante d'occultation est reconstruite avec les mêmes rectangle intérieur et bordure de 8 unités.

**Tech Stack:** SVG 1.1, XML, Python 3 (`xml.etree.ElementTree`) pour la génération et la validation.

## Global Constraints

- Canevas extérieur : `598 × 206`.
- Cadre : `8` unités sur chaque côté.
- Zone intérieure : `582 × 190`, de `(8, 8)` à `(590, 198)`.
- Le tracé fourni reste inchangé : aucune mise à l'échelle non proportionnelle ni reconstruction typographique.
- Les fichiers finaux vivent dans `docs/svg/technology-es/`.
- Aucun HTML, CSS ou fichier généré dans `dist/` n'est modifié.

---

### Task 1: Générer et valider les trois variantes SVG

**Files:**
- Create: `docs/svg/technology-es/technology-es-visible.svg`
- Create: `docs/svg/technology-es/technology-es-cover.svg`
- Create: `docs/svg/technology-es/technology-es-mask.svg`

**Interfaces:**
- Consumes: le tracé composé exact et la géométrie `598 × 206` du SVG fourni par l'utilisateur.
- Produces: trois SVG autonomes, sans dépendance externe, copiables dans les embeds Webflow existants.

- [ ] **Step 1: Ajouter le SVG de masque fourni**

Créer `technology-es-mask.svg` avec le XML fourni, en conservant le `d` du
tracé caractère pour caractère. Renommer les identifiants en
`technology-es-mask-shape` et `technology-es-mask-clip`, puis mettre à jour
leurs références `url(#...)`. Conserver les quatre rectangles de bordure et
le rectangle intérieur `#EBF0ED`.

- [ ] **Step 2: Valider que seule la variante masque existe**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
from xml.etree import ElementTree as ET

root = Path("docs/svg/technology-es")
files = sorted(path.name for path in root.glob("*.svg"))
assert files == ["technology-es-mask.svg"], files
svg = ET.parse(root / files[0]).getroot()
assert svg.attrib["viewBox"] == "0 0 598 206"
print("mask source: PASS")
PY
```

Expected: `mask source: PASS`.

- [ ] **Step 3: Générer la variante visible**

Extraire le `d` de `technology-es-mask.svg`, sans le modifier, et générer le
SVG visible avec ce script :

```python
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET

root = Path("docs/svg/technology-es")
source = root / "technology-es-mask.svg"
tree = ET.parse(source)
mask = next(
    element
    for element in tree.getroot().iter()
    if element.tag.endswith("mask")
)
source_path = next(
    element
    for element in mask.iter()
    if element.tag.endswith("path")
)
d = source_path.attrib["d"]

visible = f'''<svg width="582" height="190" viewBox="0 0 582 190"
  fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="technology-es-visible-mask"
      maskUnits="userSpaceOnUse" x="0" y="0" width="582" height="190"
      style="mask-type:luminance">
      <rect width="582" height="190" fill="white"/>
      <path d="{escape(d, quote=True)}"
        transform="translate(-8 -8)" fill="black"/>
    </mask>
  </defs>
  <rect width="582" height="190" fill="currentColor"
    mask="url(#technology-es-visible-mask)"/>
</svg>
'''
(root / "technology-es-visible.svg").write_text(visible, encoding="utf-8")
```

Cette inversion retire le fond du tracé composé et conserve uniquement les
lettres, sans cadre et sans mise à l'échelle.

- [ ] **Step 4: Générer la variante d'occultation**

Créer `technology-es-cover.svg` avec le canevas extérieur et les rectangles
suivants :

```xml
<svg width="598" height="206" viewBox="0 0 598 206"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="582" height="190" fill="#E0E0E0"/>
  <rect y="198" width="598" height="8" fill="#EBF0ED"/>
  <rect width="598" height="8" fill="#EBF0ED"/>
  <rect y="8" width="8" height="190" fill="#EBF0ED"/>
  <rect x="590" y="8" width="8" height="190" fill="#EBF0ED"/>
</svg>
```

- [ ] **Step 5: Valider le XML, les dimensions et les identifiants**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
from xml.etree import ElementTree as ET

root = Path("docs/svg/technology-es")
expected = {
    "technology-es-visible.svg": "0 0 582 190",
    "technology-es-cover.svg": "0 0 598 206",
    "technology-es-mask.svg": "0 0 598 206",
}
ids = set()
for name, view_box in expected.items():
    svg = ET.parse(root / name).getroot()
    assert svg.attrib["viewBox"] == view_box, (name, svg.attrib["viewBox"])
    for element in svg.iter():
        element_id = element.attrib.get("id")
        if element_id:
            assert element_id not in ids, element_id
            ids.add(element_id)
print("svg variants: PASS")
PY
```

Expected: `svg variants: PASS`.

- [ ] **Step 6: Vérifier la conformité du dépôt**

Run:

```bash
git diff --check
git status --short
```

Expected: aucune erreur de whitespace ; seuls les trois SVG et le plan sont
nouveaux ou modifiés.

- [ ] **Step 7: Committer les SVG**

```bash
git add -f docs/svg/technology-es/*.svg docs/superpowers/plans/2026-07-16-svg-technology-spanish.md
git commit -m "feat: ajouter les SVG technology espagnols"
```
