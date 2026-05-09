## Business
Veil - Privacy-First Creator Patronage Platform

## About
Join 1,000,000+ creators! Set up your free page to get tips, sell products, offer memberships, and grow your community. Support remains completely private through Zero-Knowledge proofs and Umbra Mixer technology.

## Visual Aesthetic
**Style**: Warm, accessible, creator-focused (inspired by Ko-fi). NOT dark or crypto-forward.
**Feel**: Playful, supportive, professional
**Tone**: Friendly, encouraging, community-driven

## Colors:
- Background: #f4efe7 (warm beige)
- Surface: #ffffff (white)
- Surface Elevated: #f4efe7 (slightly darker warm tone)
- Primary: #72a4f2 (friendly blue for CTAs)
- Secondary: #e9dfd2 (warm peachy tone)
- Text: #202020 (near-black)
- Muted: #52525b (medium gray)
- Border/Divider: rgba(0,0,0,0.05) to rgba(0,0,0,0.1)

## Typography:
- **Headings**: DM Sans Bold (400-900 weights), 72px/400 (H1), 60px/400 (H2), 48px/700 (Section), 24px/700 (Card)
- **Body**: Nunito Medium (400-800 weights), 16px/400 (body), 30px/600 (buttons), 14px/500 (small/caption)
- **Imports**: Google Fonts: DM Sans, Nunito

## Reusable Components

### VeilHeader
```html
<header class="fixed top-0 left-0 right-0 h-20 bg-veil-bg/90 backdrop-blur-md z-50 flex items-center justify-center border-b border-black/5">
    <div class="w-full max-w-7xl px-6 md:px-12 flex items-center justify-between">
        <a href="#" class="flex items-center gap-2 group">
            <div class="w-10 h-10 rounded-full bg-veil-primary flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                <iconify-icon icon="lucide:heart-handshake" class="text-2xl"></iconify-icon>
            </div>
            <span class="font-heading font-black text-2xl md:text-3xl tracking-tight text-veil-text">Veil</span>
        </a>

        <nav class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-base font-bold text-veil-text hover:text-veil-primary hover:-translate-y-0.5 transition-all">Benefits</a>
            <a href="#how-it-works" class="text-base font-bold text-veil-text hover:text-veil-primary hover:-translate-y-0.5 transition-all">How it Works</a>
            <a href="#creators" class="text-base font-bold text-veil-text hover:text-veil-primary hover:-translate-y-0.5 transition-all">Creators</a>
        </nav>

        <div class="flex items-center gap-4">
            <a href="#login" class="hidden sm:block text-base font-bold text-veil-text hover:text-veil-primary transition-colors">Log in</a>
            <a href="#signup" class="pill-button-primary px-6 py-2.5 text-base md:text-lg flex items-center gap-2">
                Start your page
            </a>
        </div>
    </div>
</header>
```

**Props**: activeItem, homeHref, benefitsHref, howItWorksHref, creatorsHref, loginHref, signupHref

### VeilFooter
```html
<footer class="w-full bg-white border-t border-black/5 pt-16 pb-8 z-10 relative">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
        <div class="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div class="flex items-center gap-2">
                <iconify-icon icon="lucide:heart-handshake" class="text-2xl text-veil-primary"></iconify-icon>
                <span class="font-heading font-black text-2xl tracking-tight text-veil-text">Veil</span>
            </div>
            
            <div class="flex flex-wrap justify-center gap-8">
                <a href="#about" class="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors">About</a>
                <a href="#privacy" class="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors">Privacy Policy</a>
                <a href="#terms" class="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors">Terms of Service</a>
                <a href="#twitter" class="text-base font-bold text-veil-muted hover:text-veil-primary transition-colors flex items-center gap-2">
                    <iconify-icon icon="simple-icons:x"></iconify-icon> Twitter
                </a>
            </div>
        </div>
        
        <div class="text-center text-sm font-medium text-veil-muted">
            &copy; 2024 Veil. Making creator support private and friendly.
        </div>
    </div>
</footer>
```

**Props**: aboutHref, privacyHref, termsHref, twitterHref

### Button Styles
```css
.pill-button-primary {
    background-color: #72a4f2;
    color: #ffffff;
    border-radius: 9999px;
    font-weight: 700;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 12px 24px;
}
.pill-button-primary:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 25px -4px rgba(114, 164, 242, 0.6);
}
.pill-button-primary:active {
    transform: translateY(0) scale(0.98);
}

.pill-button-secondary {
    background-color: #ffffff;
    color: #202020;
    border: 2px solid #202020;
    border-radius: 9999px;
    font-weight: 700;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 12px 24px;
}
.pill-button-secondary:hover {
    background-color: #e9dfd2;
    border-color: #e9dfd2;
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 25px -4px rgba(32, 32, 32, 0.15);
}
```

## Design System

### Spacing Scale
8px, 12px, 16px, 24px, 32px, 48px, 64px

### Border Radius
- Buttons & Pills: 9999px (full rounded)
- Cards: 32px (large rounded)
- Inputs: 16px (medium rounded)
- Small elements: 8px-12px

### Shadows
- card: 0 4px 20px -2px rgba(32, 32, 32, 0.05)
- card-hover: 0 16px 40px -4px rgba(32, 32, 32, 0.15)

### Animations
- float: 6s ease-in-out infinite (vertical movement)
- wiggle-slow: 4s ease-in-out infinite (gentle rotation)
- fade-in-up: 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)
- Hover state transitions: 0.2s - 0.3s

## Key Interaction Patterns
1. **Hover Effects**: Cards lift with -translate-y-2 and enhanced shadow
2. **Button States**: Scale down on active, lift on hover
3. **Scroll Reveals**: Elements fade in and slide up as they enter viewport
4. **Micro-interactions**: Logo rotation, button bounces, smooth color transitions
5. **Form Focus**: Blue border highlight, subtle blue glow box-shadow

## Content Imagery
Use warm-toned, authentic creator photos. Avoid generic stock photos when possible. The project asset library includes 20+ creator and lifestyle images suitable for the design.