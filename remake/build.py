"""Build an offline index.html without npm or external network requests."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent
three = (root / 'vendor/three.module.js').read_text(encoding='utf-8')
match = re.search(r'export\s*\{([^}]+)\};?\s*$', three)
if not match:
    raise RuntimeError('Expected one self-contained Three.js export list')
exports = []
for item in match.group(1).split(','):
    names = item.strip().split(' as ')
    exports.append((names[1] + ': ' + names[0]) if len(names) == 2 else names[0])
three = three[:match.start()] + 'return {' + ','.join(exports) + '};'
license_text = (root / 'vendor/THREE-LICENSE.txt').read_text(encoding='utf-8')
parts = ['/*\n' + license_text + '\n*/\nconst T = (() => {\n' + three + '\n})();']
for filename in ['data.mjs', 'sim.mjs', 'world.mjs', 'app.mjs']:
    code = (root / filename).read_text(encoding='utf-8')
    code = re.sub(r'^import .*?;\s*$', '', code, flags=re.M)
    code = re.sub(r'\bexport (?=(const|class|function)\b)', '', code)
    parts.append(code)
script = '\n'.join(parts).replace('</script', '<\\/script')
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'style.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script type="module" src="app.mjs"></script>', '<script type="module">\n' + script + '\n</script>')
target = root.parent / 'index.html'
target.write_text(html, encoding='utf-8')
print(f'Built {target.name}: {len(html.encode("utf-8")):,} bytes; no runtime network dependencies')
