# /design — canvas mode

**Mode:** poster / art / print / magazine page. Build output is a design-philosophy `.md` + a single-page `design/<screen>/<screen>.png` (or `.pdf`).

## When to use

"Design a poster", "make a piece of art", "a magazine spread", "a print page", "a gallery-quality visual". Any static, single-page visual artifact that is meant to be *looked at*, not *clicked*. This mode creates original art — it never copies an existing artist's work. Even when the ask names a familiar subject (a movie, a game, a book), the response stays abstract and sophisticated — never a fan-art likeness.

## Workflow — mapped onto the universal spine

Canvas is a Consult- and Explore-heavy mode: the philosophy *is* the direction, and the variants express it.

### 1. Consult — create the design philosophy (`.md`) and deduce the subtle reference

Output a **visual philosophy** first — a mini-manifesto for an art movement, not a layout or template. It is interpreted through form, space, color, composition; images, graphics, shapes, patterns; minimal text as visual accent. Roughly 90% visual, 10% essential text.

1. **Name the movement** (1–2 words): "Brutalist Joy", "Chromatic Silence", "Metabolist Dreams", "Concrete Poetry".
2. **Articulate the philosophy** (4–6 substantial paragraphs) expressing how the movement manifests through: space and form, color and material, scale and rhythm, composition and balance, visual hierarchy. Rules:
   - **Avoid redundancy** — each aspect mentioned once; no repeated color-theory or typography points.
   - **Emphasize craftsmanship repeatedly** — the final work must read as "meticulously crafted", "the product of deep expertise", "master-level execution", "countless hours". Repeat this framing several times.
   - **Leave creative room** — specific on aesthetic direction, but concise enough that the executant makes interpretive choices at the same high level.
   - Keep it generic: written as a philosophy usable anywhere, not a description of this specific artifact.
3. **Write it as a `.md`** and feed it to the Explore phase.

Reference philosophy examples (condensed): "Concrete Poetry" (massive color blocks, sculptural single-word type, Polish-poster energy meets Le Corbusier), "Chromatic Language" (color zones as the information system, Josef Albers meets data-viz), "Analog Meditation" (paper grain, ink bleeds, vast negative space, Japanese photobook), "Organic Systems" (rounded natural clustering, modular growth), "Geometric Silence" (Swiss formalism meets Brutalist material honesty).

**Deduce the subtle reference (CRITICAL).** Before any canvas work, identify the quiet conceptual thread embedded in the original request. It is not literal — someone familiar with the subject should feel it intuitively while everyone else experiences a masterful abstract composition. The philosophy supplies the aesthetic language; the deduced reference supplies the soul — the conceptual DNA woven invisibly into form, color, composition. Refine it so it deepens the work without announcing itself (a jazz musician quoting another song).

### 2. Explore — generate 2–4 divergent compositions

1. **Fix the canvas.** One single page, highly visual, design-forward (unless the user asks for more). Set exact print dimensions.
2. **Generate 2–4 variants** at `design/<screen>/v1.png … vN.png`. Each is a distinct composition expressing the same philosophy — different spatial architecture, palette discipline, or typographic treatment (per the anti-convergence directive: not siblings). Present them on `design/state/board.html`, iterate with the user, pick one.
3. **Express the philosophy's mechanics** in every composition:
   - Generally use **repeating patterns and perfect shapes**; treat the abstract design like a scientific bible — dense accumulation of marks, repeated elements, layered patterns that build meaning through patient repetition, rewarding sustained viewing.
   - Add **sparse, clinical typography and systematic reference markers** — as if a diagram from an imaginary discipline documenting an invisible subject.
   - Anchor with a **simple phrase or detail positioned subtly**; a **limited palette that feels intentional and cohesive**.
   - Use **text as a contextual element**: minimal and visual-first, letting context choose between whisper-quiet labels and bold typographic gestures (a punk-venue poster speaks louder than a ceramics-studio identity). Most often the type is thin; all of it must be design-forward. **Use different fonts for text, from the local font kit (`assets/fonts/`).**
   - Nothing falls off the page; nothing overlaps; every element has breathing room and separation. Non-negotiable.

**Variant discipline.** Each variant is one coherent composition of the *same* philosophy — diverge on structure, palette, and type treatment, not on meaning. Never mix the philosophy; never bolt a second movement onto a variant to "add variety". The user picks a composition, not a remix.

### 3. Build — finalize, then polish

1. **Produce the survivor.** Render the chosen variant at exact print size (HTML/CSS canvas at the target dimensions rendered to PNG/PDF — screenshot via Playwright MCP if available; or SVG → PNG/PDF). Set the print-bleed/margins per the deliverable.
2. **Second pass — refine, don't add.** The user has already asked for pristine, museum-grade work. Resist adding graphics, filters, or new shapes. Ask instead: "How can I make what's here more a piece of art?" — make the existing composition more cohesive with the philosophy, crisper, more of a whole. This is the craftsmanship pass.
3. **Settle.** Delete losing variants; rename the survivor to `design/<screen>/<screen>.png` (or `.pdf`); the philosophy `.md` ships alongside it.
4. **Multi-page option.** If requested, create additional pages along the same philosophy but distinctly different — unique twists on the original, almost telling a story, each a page in a coffee-table book.

## Verification / quality gate

1. **Craftsmanship gate:** alignment flawless, nothing overlaps, nothing touches the edges, margins breathing. The piece could be shown to a museum as proof of expertise — "pristine, a masterpiece of craftsmanship". Double-check before calling it done.
2. **Philosophy fidelity:** every element serves the written philosophy; no element is decoration bolted on.
3. **Taste gate** (`references/taste-gate.md`): the artifact is original art, not a slop composition (no default gradients, no stock-placeholder feel, no clip-art).
4. **Reference check:** the subtle reference survives — a knowledgeable viewer feels it, an uninformed viewer sees a masterful abstract composition. Never copy another artist's work (copyright).
5. **Typography:** every text element set from the local font kit; none falls off the page; type is design-forward even where it is sparse.

## Scripts & references

| Asset | Path | Use |
|---|---|---|
| Font kit | `assets/fonts/` | local faces for canvas typography (never a web fetch) |
| Taste gate | `references/taste-gate.md` | anti-slop + anti-convergence across variants |
| Intelligence | `scripts/search/search.py` | optional aesthetics grounding (`--domain style "poster editorial"`) |
| Canvas design system (full) | `references/ui-styling/canvas-design-system.md` | the complete philosophy/movement/craftsmanship reference this section condenses |
| Design process | `references/design-process.md` | brainstorm → critique loop for the philosophy |
