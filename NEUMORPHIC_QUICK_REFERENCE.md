# Neumorphic Effects - Quick Reference Guide

## 🎨 File: NEUMORPHIC_QUICK_REFERENCE.md

A visual guide to the 3D neumorphic effects implemented in RollNFTs Frontend.

---

## 📦 Core Neumorphic Pattern

### Base Card Structure
```scss
.component {
  // Base styling
  background: $cardBg;
  border-radius: $radius-lg;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  transform-style: preserve-3d;
  
  // Multi-layer shadow (OUTER)
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),      // Main depth shadow
    0 2px 4px rgba(0, 0, 0, 0.2),       // Close shadow
    inset 0 1px 2px rgba(255, 255, 255, 0.1),   // Top highlight (light)
    inset 0 -2px 8px rgba(0, 0, 0, 0.2);        // Bottom shadow (depth)
  
  // Depth layer (::before)
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.1) 100%
    );
    pointer-events: none;
  }
  
  // Glow overlay (::after)
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(77, 156, 255, 0.15) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  
  // Hover state
  &:hover {
    transform: translate3d(0, -8px, 0) scale(1.02);
    border-color: rgba(77, 156, 255, 0.5);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.4),           // Deep shadow
      0 0 0 1px rgba(77, 156, 255, 0.3),        // Border glow
      0 0 40px rgba(77, 156, 255, 0.4),         // Outer glow
      inset 0 1px 3px rgba(255, 255, 255, 0.15), // Top highlight
      inset 0 -3px 12px rgba(0, 0, 0, 0.2);     // Bottom depth
    
    &::after {
      opacity: 1;
    }
  }
}
```

---

## 🎯 Component-Specific Patterns

### 1. NFT Card (Blue Theme)
```scss
// File: src/components/NFTCard.scss
border: 1px solid rgba(77, 156, 255, 0.2);    // Rest state
border-color: rgba(77, 156, 255, 0.5);        // Hover state
glow: rgba(77, 156, 255, 0.4);                // Glow color
```

### 2. Collection Card (Purple Theme)
```scss
// File: src/components/CollectionCard.scss
border: 1px solid rgba(168, 85, 247, 0.2);    // Rest state
border-color: rgba(168, 85, 247, 0.5);        // Hover state
glow: rgba(168, 85, 247, 0.4);                // Glow color
```

### 3. Buttons (Multi-Theme)
```scss
// File: src/components/shared/Button.scss

// Primary (Blue)
box-shadow: 
  0 4px 12px rgba(77, 156, 255, 0.25),
  inset 0 1px 2px rgba(255, 255, 255, 0.15);

// Success (Green)
box-shadow: 
  0 4px 12px rgba(37, 214, 149, 0.25),
  inset 0 1px 2px rgba(255, 255, 255, 0.15);

// Danger (Red)
box-shadow: 
  0 4px 12px rgba(216, 29, 60, 0.25),
  inset 0 1px 2px rgba(255, 255, 255, 0.15);

// Top highlight (all buttons)
&::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(1px);
  opacity: 0.7;
}
```

### 4. Modal (Elevated)
```scss
// File: src/components/shared/Modal.scss
box-shadow: 
  0 20px 60px rgba(0, 0, 0, 0.6),          // Very deep shadow
  0 10px 20px rgba(0, 0, 0, 0.4),          // Medium shadow
  0 0 0 1px rgba(77, 156, 255, 0.2),       // Border glow
  0 0 40px rgba(77, 156, 255, 0.15),       // Outer glow
  inset 0 1px 3px rgba(255, 255, 255, 0.1), // Top highlight
  inset 0 -3px 15px rgba(0, 0, 0, 0.2);    // Bottom depth
```

### 5. Stat Cards (Interactive)
```scss
// File: src/pages/Home.scss
// Rest state
box-shadow: 
  0 4px 12px rgba(0, 0, 0, 0.3),
  inset 0 1px 2px rgba(255, 255, 255, 0.1);

// Hover state
transform: translate3d(0, -6px, 0) scale(1.03);
box-shadow: 
  0 12px 30px rgba(0, 0, 0, 0.3),
  0 0 0 1px rgba(37, 214, 149, 0.2),
  0 0 25px rgba(37, 214, 149, 0.2),
  inset 0 1px 2px rgba(255, 255, 255, 0.1);

// Value animation
&:hover .value {
  transform: scale(1.05);
}
```

---

## 🎨 Color Reference

### Border Colors (Rest State)
```scss
// 20% opacity for subtle presence
$nft-border: rgba(77, 156, 255, 0.2);        // Blue
$collection-border: rgba(168, 85, 247, 0.2);  // Purple
$success-border: rgba(37, 214, 149, 0.2);     // Green
$danger-border: rgba(216, 29, 60, 0.2);       // Red
```

### Border Colors (Hover State)
```scss
// 40-50% opacity for emphasis
$nft-border-hover: rgba(77, 156, 255, 0.5);      // Blue
$collection-border-hover: rgba(168, 85, 247, 0.5); // Purple
$success-border-hover: rgba(37, 214, 149, 0.4);   // Green
$danger-border-hover: rgba(216, 29, 60, 0.5);     // Red
```

### Glow Colors
```scss
// Used in box-shadow and radial gradients
$blue-glow: rgba(77, 156, 255, 0.4);
$purple-glow: rgba(168, 85, 247, 0.4);
$green-glow: rgba(37, 214, 149, 0.4);
$red-glow: rgba(216, 29, 60, 0.4);
$orange-glow: rgba(255, 140, 66, 0.4);
$cyan-glow: rgba(6, 182, 212, 0.4);
```

---

## 🎭 Shadow Anatomy

### Layer 1: Outer Depth Shadow
```scss
0 20px 40px rgba(0, 0, 0, 0.4)
// Purpose: Creates main depth/elevation
// Distance: Far (20-40px)
// Blur: Large (40px)
// Opacity: Medium (40%)
```

### Layer 2: Close Shadow
```scss
0 4px 8px rgba(0, 0, 0, 0.3)
// Purpose: Defines immediate contact shadow
// Distance: Close (4-8px)
// Blur: Medium (8px)
// Opacity: Medium (30%)
```

### Layer 3: Border Glow
```scss
0 0 0 1px rgba(77, 156, 255, 0.3)
// Purpose: Colored outline emphasis
// Spread: 1px
// Blur: None (crisp edge)
// Color: Theme-specific
```

### Layer 4: Outer Glow
```scss
0 0 40px rgba(77, 156, 255, 0.4)
// Purpose: Atmospheric glow effect
// Blur: Large (40px)
// Color: Theme-specific
// Opacity: Medium (40%)
```

### Layer 5: Inset Top Highlight
```scss
inset 0 1px 3px rgba(255, 255, 255, 0.15)
// Purpose: Simulates light reflection from above
// Direction: From top
// Distance: Small (1-3px)
// Color: White with low opacity
```

### Layer 6: Inset Bottom Shadow
```scss
inset 0 -3px 12px rgba(0, 0, 0, 0.2)
// Purpose: Creates internal depth
// Direction: From bottom
// Distance: Medium (-3 to -12px)
// Color: Black with low opacity
```

---

## 🎬 Animation Patterns

### Standard Card Lift
```scss
// Rest
transform: translate3d(0, 0, 0) scale(1);

// Hover
transform: translate3d(0, -8px, 0) scale(1.02);
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

### Button Press
```scss
// Rest
transform: translate3d(0, 0, 0);

// Hover
transform: translate3d(0, -4px, 0) scale(1.02);

// Active
transform: translate3d(0, -2px, 0) scale(0.98);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Stat Card Interactive
```scss
// Rest
transform: translate3d(0, 0, 0) scale(1);

// Hover
transform: translate3d(0, -6px, 0) scale(1.03);

// Value animation
.value {
  transform: scale(1.05);
}
```

### Icon Lift (3D)
```scss
// Rest
transform: translate3d(0, 0, 0) scale(1);

// Hover
transform: translate3d(0, 0, 10px) scale(1.15) rotate(5deg);
```

---

## 🔧 Mixins Usage

### Using neumorphic-card mixin
```scss
.my-component {
  @include neumorphic-card;
  // Adds: base styling, shadows, ::before depth layer
  
  // Customize border color
  border: 1px solid rgba(77, 156, 255, 0.2);
  
  // Add ::after glow
  &::after {
    content: '';
    // ... glow styling
  }
}
```

### Using neumorphic-hover mixin
```scss
.my-component {
  &:hover {
    @include neumorphic-hover;
    // Adds: transform, multi-layer shadows with green theme
    
    // Override border color for different theme
    border-color: rgba(77, 156, 255, 0.5);
    
    // Override glow color in shadows
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(77, 156, 255, 0.3),
      0 0 40px rgba(77, 156, 255, 0.4),
      inset 0 1px 3px rgba(255, 255, 255, 0.15),
      inset 0 -3px 12px rgba(0, 0, 0, 0.2);
  }
}
```

---

## 📱 Responsive Adjustments

### Mobile (< 480px)
```scss
@include mobile {
  // Reduce shadow intensity
  box-shadow: 
    0 3px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
  
  // Reduce lift distance
  &:hover {
    transform: translate3d(0, -4px, 0) scale(1.01);
  }
}
```

### Tablet (768px - 1024px)
```scss
@include tablet {
  // Standard effects (as defined)
}
```

### Desktop (1024px+)
```scss
@include desktop {
  // Enhanced effects
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.35),
    inset 0 1px 3px rgba(255, 255, 255, 0.12);
  
  &:hover {
    box-shadow: 
      0 24px 48px rgba(0, 0, 0, 0.45),
      0 0 50px rgba(77, 156, 255, 0.5);
  }
}
```

---

## ⚡ Performance Tips

### DO ✅
```scss
// Use transform3d (hardware accelerated)
transform: translate3d(0, -8px, 0);

// Combine transforms
transform: translate3d(0, -8px, 0) scale(1.02);

// Use will-change sparingly
.heavy-animation {
  will-change: transform;
}
```

### DON'T ❌
```scss
// Avoid 2D transforms
transform: translateY(-8px);

// Avoid animating position/margin
margin-top: -8px;

// Don't use will-change everywhere
* {
  will-change: transform; // Bad!
}
```

---

## 🎯 Copy-Paste Examples

### Example 1: Blue-themed Card
```scss
.blue-card {
  @include neumorphic-card;
  border: 1px solid rgba(77, 156, 255, 0.2);
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(77, 156, 255, 0.15) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  
  &:hover {
    transform: translate3d(0, -8px, 0) scale(1.02);
    border-color: rgba(77, 156, 255, 0.5);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(77, 156, 255, 0.3),
      0 0 40px rgba(77, 156, 255, 0.4),
      inset 0 1px 3px rgba(255, 255, 255, 0.15),
      inset 0 -3px 12px rgba(0, 0, 0, 0.2);
    
    &::after {
      opacity: 1;
    }
  }
}
```

### Example 2: Purple-themed Badge
```scss
.purple-badge {
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-full;
  background: rgba(168, 85, 247, 0.15);
  color: $purple;
  border: 1px solid rgba(168, 85, 247, 0.3);
  box-shadow: 
    0 2px 6px rgba(168, 85, 247, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 3px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 4px 8px rgba(168, 85, 247, 0.3),
      inset 0 1px 2px rgba(255, 255, 255, 0.15),
      inset 0 -2px 5px rgba(0, 0, 0, 0.2);
  }
}
```

### Example 3: Green Success Button
```scss
.success-button {
  padding: $spacing-md $spacing-xl;
  border-radius: $radius-md;
  background: $gradientGreen;
  color: $primaryWhite;
  border: none;
  position: relative;
  box-shadow: 
    0 4px 12px rgba(37, 214, 149, 0.25),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.15),
    inset 0 -2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    filter: blur(1px);
    opacity: 0.7;
  }
  
  &:hover {
    box-shadow: 
      0 8px 24px rgba(37, 214, 149, 0.4),
      0 4px 8px rgba(0, 0, 0, 0.3),
      0 0 30px rgba(37, 214, 149, 0.3),
      inset 0 1px 3px rgba(255, 255, 255, 0.2),
      inset 0 -3px 12px rgba(0, 0, 0, 0.2);
    transform: translate3d(0, -4px, 0) scale(1.02);
  }
  
  &:active {
    transform: translate3d(0, -2px, 0) scale(0.98);
  }
}
```

---

## 📊 Visual Hierarchy

### Elevation Levels
1. **Base Level** (0px): Background, page container
2. **Level 1** (4-8px): Cards, panels, sections
3. **Level 2** (12-16px): Hover states, active cards
4. **Level 3** (20-24px): Modals, dropdowns
5. **Level 4** (30-40px): Tooltips, notifications

---

## ✨ Pro Tips

1. **Always use transform3d** for hardware acceleration
2. **Keep inset shadows subtle** (10-20% opacity)
3. **Match glow color to theme** for consistency
4. **Use cubic-bezier** for smooth, natural easing
5. **Test on 60Hz and 120Hz displays**
6. **Respect reduced-motion** preference
7. **Combine transforms** instead of chaining
8. **Use ::before for depth**, ::after for glows
9. **Keep hover lift distance** at -8px to -12px
10. **Use 0.3-0.4s duration** for most animations

---

**Quick Reference Version**: 1.0  
**Last Updated**: October 22, 2025  
**Compatible With**: All modern browsers (Chrome 90+, Firefox 88+, Safari 14+)



