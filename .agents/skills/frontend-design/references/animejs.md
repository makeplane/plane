# Anime.js v4 Reference Guide for AI Assistants

## 🚨 CRITICAL: ALWAYS USE ANIME.JS V4 SYNTAX 🚨

**This project uses Anime.js v4.x.x - DO NOT use v3 syntax under any circumstances**

**If you're about to write `import anime from 'animejs'` - STOP!**
**That's v3. This project uses v4. Use the correct import below.**

## 🚀 Quick Start - Essential Setup

### 1. Correct v4 Import (REQUIRED)
```javascript
// ✅ CORRECT v4 imports
import { animate, createTimeline, stagger, utils, svg, eases, engine } from 'animejs';

// ❌ WRONG v3 import - NEVER USE THIS
// import anime from 'animejs';
```

### 2. Configure Time Units to Seconds (SET ONCE IN APP ENTRY POINT)
```javascript
// ⚠️ IMPORTANT: Set this ONLY ONCE in your app's main entry point
// For React: App.js/App.tsx or index.js/index.tsx
// For Vue: main.js/main.ts
// For vanilla JS: The main script file that loads first

import { engine } from 'animejs';

// Set ONLY in the app's entry point, NOT in components
engine.timeUnit = 's';

// Now ALL durations use seconds everywhere: 1 = 1 second, 0.5 = 500ms
// DO NOT set this in individual components - it's a global setting!
```

### 3. Single-Line Format for Simple Animations (REQUIRED)
```javascript
// ✅ GOOD - Clean, readable, one line for simple tweens
animate('.element', { x: 250, duration: 1, ease: 'outQuad' });

// ❌ BAD - Unnecessary multi-line for simple tweens
animate('.element', {
  x: 250,
  duration: 1,
  ease: 'outQuad'
});
```

## ✅ Quick Validation Checklist

Before generating anime.js code, verify:
- [ ] Using `import { animate, ... } from 'animejs'` NOT `import anime`
- [ ] Set `engine.timeUnit = 's'` ONLY ONCE in app entry point (NOT in components)
- [ ] Using seconds for all durations (1 = 1 second)
- [ ] Simple animations on ONE LINE
- [ ] Using `animate()` NOT `anime()`
- [ ] Using `createTimeline()` NOT `anime.timeline()`
- [ ] Using `ease:` NOT `easing:`
- [ ] Using `to:` for values, NOT `value:`
- [ ] Using `on` prefix for callbacks (onUpdate, onComplete)
- [ ] Using `loop` and `alternate` NOT `direction`
- [ ] Using correct v4 stagger syntax with `stagger()`
- [ ] Using shorthand properties (x, y, z) when possible

## 🎯 Core API - Most Common Patterns

### Basic Animation (single line for simple tweens)
```javascript
// Simple tween - ALWAYS one line
animate('.element', { x: 250, rotate: 180, duration: 0.8, ease: 'inOutQuad' });

// Fade in - one line
animate('.element', { opacity: [0, 1], y: [20, 0], duration: 0.6, ease: 'outQuad' });

// Scale bounce - one line
animate('.element', { scale: [0, 1], duration: 0.8, ease: 'outElastic(1, 0.5)' });

// Infinite loop - one line
animate('.element', { rotate: 360, duration: 2, loop: true, ease: 'linear' });
```

### Timeline Creation
```javascript
const tl = createTimeline({ defaults: { duration: 1, ease: 'outQuad' } });

tl.add('.element1', { x: 250 })
  .add('.element2', { y: 100 }, '+=0.2')  // 0.2s after previous
  .add('.element3', { rotate: 180 }, '<'); // at start of previous
```

### Stagger Animations (single line)
```javascript
animate('.elements', { x: 250, delay: stagger(0.1) });  // 0.1s between each
animate('.elements', { x: 250, delay: stagger(0.1, { from: 'center' }) });
```

## ❌ Common AI Mistakes to Avoid

### MISTAKE #1: Using v3 Import Pattern
```javascript
// ❌ WRONG - This is v3
import anime from 'animejs';
anime({ targets: '.element', translateX: 250 });

// ✅ CORRECT - Always use v4
import { animate } from 'animejs';
animate('.element', { x: 250 });
```

### MISTAKE #2: Using 'targets' Property
```javascript
// ❌ WRONG - 'targets' is v3
animate({ targets: '.element', translateX: 250 });

// ✅ CORRECT - First parameter is the target
animate('.element', { x: 250 });
```

### MISTAKE #3: Using 'easing' Instead of 'ease'
```javascript
// ❌ WRONG
animate('.element', { x: 250, easing: 'easeInOutQuad' });

// ✅ CORRECT
animate('.element', { x: 250, ease: 'inOutQuad' });
```

### MISTAKE #4: Using 'value' for Animation Values
```javascript
// ❌ WRONG - 'value' is v3
animate('.element', { x: { value: 250 } });

// ✅ CORRECT - Use 'to' for values
animate('.element', { x: { to: 250 } });
```

### MISTAKE #5: Wrong Timeline Syntax
```javascript
// ❌ WRONG - anime.timeline() is v3
const tl = anime.timeline();

// ✅ CORRECT - Use createTimeline
import { createTimeline } from 'animejs';
const tl = createTimeline();
```

## 📋 Property Syntax Reference (v3 → v4)

### Animation Values
```javascript
// ✅ v4: Use 'to' for target values
{ opacity: { to: 0.5 } }
{ x: { to: [0, 100] } }

// ❌ v3: DON'T use 'value'
// { opacity: { value: 0.5 } }
```

### Easing Functions
```javascript
// ✅ v4: Use 'ease' (no 'ease' prefix)
{ ease: 'inOutQuad' }
{ ease: 'outElastic(1, 0.5)' }
{ ease: 'cubicBezier(0.4, 0, 0.2, 1)' }

// ❌ v3: DON'T use 'easing' or 'ease' prefix
// { easing: 'easeInOutQuad' }
```

### Direction & Looping
```javascript
// ✅ v4
{
  loop: true,        // infinite loop
  loop: 3,          // loop 3 times
  alternate: true,   // alternate direction
  reversed: true     // play in reverse
}

// ❌ v3: DON'T use 'direction'
// { direction: 'alternate' }
```

### Transform Properties (Shorthand Preferred)
```javascript
// ✅ Both syntaxes work in v4:
animate('.element', { x: 100, y: 50, z: 25 });           // shorthand (preferred)
animate('.element', { translateX: 100, translateY: 50, translateZ: 25 }); // explicit
```

### Callbacks (ALL prefixed with 'on')
```javascript
// ✅ v4: Simple callback - keep on one line
animate('.element', { x: 250, duration: 1, onComplete: () => console.log('Done!') });

// ✅ v4: Multiple callbacks - use multi-line
animate('.element', {
  x: 250,
  duration: 1,
  onBegin: (anim) => console.log('Started'),
  onUpdate: (anim) => console.log('Progress:', anim.progress),
  onComplete: (anim) => console.log('Finished')
});

// ❌ v3: DON'T use unprefixed callbacks
// { update: () => {}, complete: () => {} }
```

## 📝 Code Formatting Guidelines

### ALWAYS Use Single-Line Format for Simple Animations
**This is mandatory for readability** - Use for animations with ≤4 properties:
```javascript
// ✅ GOOD - Clean, readable, one line
animate('.element', { x: 250, duration: 1, ease: 'outQuad' });
animate('.box', { opacity: 0.5, scale: 0.8, duration: 0.3 });

// ❌ BAD - Unnecessary multi-line for simple tweens
animate('.element', {
  x: 250,
  duration: 1,
  ease: 'outQuad'
});
```

### Multi-Line Format (Only for Complex Animations)
Use for animations with >4 properties or callbacks:
```javascript
// Complex animation with callbacks - multi-line is appropriate
animate('.element', {
  x: { to: [0, 100, 50], duration: 2 },
  y: { to: [0, -50, 0], duration: 2 },
  scale: [0, 1.2, 1],
  ease: 'outElastic(1, 0.5)',
  onComplete: () => console.log('Done!')
});
```

## 🎨 Common Animation Patterns

### Hover Animation (single line per animation)
```javascript
element.addEventListener('mouseenter', () => animate(element, { scale: 1.1, duration: 0.3, ease: 'outQuad' }));
element.addEventListener('mouseleave', () => animate(element, { scale: 1, duration: 0.3, ease: 'outQuad' }));
```

### Sequential Timeline
```javascript
const tl = createTimeline({ defaults: { duration: 0.5 } });
tl.add('.step1', { x: 100 })
  .add('.step2', { y: 100 })
  .add('.step3', { scale: 2 });
```

### Scroll-triggered Animation
```javascript
import { createScrollObserver } from 'animejs';

createScrollObserver({
  target: '.scroll-element',
  root: document.querySelector('.scroll-container'),
  play: () => animate('.element', { x: 250, duration: 1 }),
  visibility: 0.5
});
```

## 🔧 Advanced Features

### SVG Animations
```javascript
import { animate, svg } from 'animejs';

// Morph path (single line)
animate('#path1', { d: svg.morphTo('#path2'), duration: 1 });

// Draw SVG line
const drawable = svg.createDrawable('.svg-path');
animate(drawable, { draw: '0% 100%', duration: 2 });

// Motion path (single line for simple usage)
const motionPath = svg.createMotionPath('#motion-path');
animate('.element', { x: motionPath.translateX, y: motionPath.translateY, rotate: motionPath.rotate });
```

### Utility Functions
```javascript
import { utils } from 'animejs';

// DOM selection
const elements = utils.$('.elements');

// Get current value
const currentX = utils.get('.element', 'translateX');

// Set values immediately
utils.set('.element', { x: 100, opacity: 0.5 });

// Remove animations
utils.remove('.element');

// Math utilities
utils.random(0, 100);
utils.shuffle([1, 2, 3, 4]);
utils.lerp(0, 100, 0.5); // 50
utils.clamp(150, 0, 100); // 100
```

### TypeScript Support
```typescript
import { animate, createTimeline, JSAnimation, Timeline, AnimationParams, TimelineParams } from 'animejs';

// Single line for simple animations
const animation: JSAnimation = animate('.element', { x: 250, duration: 1 } as AnimationParams);

const timeline: Timeline = createTimeline({ defaults: { duration: 0.8 } } as TimelineParams);
```

## ⚡ Performance Tips

1. **Use transforms over position properties**
   ```javascript
   // ✅ Good - uses transform
   animate('.element', { x: 100 });
   
   // ❌ Avoid - triggers layout
   animate('.element', { left: 100 });
   ```

2. **Batch animations in timelines**
   ```javascript
   // ✅ Good - single timeline
   const tl = createTimeline();
   elements.forEach(el => tl.add(el, { x: 100 }));
   
   // ❌ Avoid - multiple animations
   elements.forEach(el => animate(el, { x: 100 }));
   ```

3. **Use will-change CSS property for complex animations**
   ```css
   .animated-element {
     will-change: transform, opacity;
   }
   ```

## 🚫 How to Identify V3 Code (DON'T USE)

If you see ANY of these patterns, it's v3 and MUST be updated:

```javascript
// All of these are V3 - NEVER USE:
anime({ ... })
anime.timeline()
anime.stagger()
anime.random()
anime.remove()
anime.get()
anime.set()
anime.running
{ targets: '...' }
{ easing: '...' }
{ value: ... }
{ direction: 'alternate' }
```

## 💡 AI Code Generation Rules

When asked to create animations with anime.js:

1. **ONLY** set `engine.timeUnit = 's'` ONCE in the app's main entry point (App.js, main.js, index.js) - NEVER in components
2. **ALWAYS** use seconds for all durations (1 = 1 second)
3. **ALWAYS** format simple animations on ONE LINE
4. **ALWAYS** start with v4 imports
5. **NEVER** use `anime()` function
6. **ALWAYS** use `animate()` for animations
7. **NEVER** include `targets` property
8. **ALWAYS** use `ease` not `easing`
9. **NEVER** use `value`, use `to` instead
10. **ALWAYS** prefix callbacks with `on`
11. **NEVER** use `direction`, use `alternate` and `reversed`
12. **ALWAYS** use `createTimeline()` for timelines
13. **PREFER** shorthand (`x`) over explicit (`translateX`)
14. **FORMAT** short animations on single line (≤4 properties)
15. **NEVER** generate v3 syntax under any circumstances

## NPM Installation
```bash
npm install animejs
```

## Version Check
```javascript
// Current version: 4.x.x
// If you see any code using anime({ targets: ... }), it's v3 and needs updating!
```