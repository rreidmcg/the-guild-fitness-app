# Technical Sprite Specifications

## Player Sprite Requirements

### Dimensions & Format
- **Resolution**: 120x160 pixels (minimum), 240x320 pixels (recommended for HD)
- **Aspect Ratio**: 3:4 (width:height)
- **Format**: PNG-24 with alpha transparency (preferred) or high-quality JPG
- **Color Depth**: 24-bit or 32-bit (with alpha)

### Character Positioning
- **Orientation**: Facing right (towards enemy side)
- **Centering**: Character centered in frame with 10-15% padding on all sides
- **Stance**: Neutral battle-ready pose, standing upright
- **Ground Level**: Character feet at ~90% from top of image

### Action Sprite Variations
- **player-idle-male.png**: Default idle pose for male avatars - martial arts stance with brown hair, tank top, green pants
- **player.png**: Base idle pose sprite
- **player-attack.png**: Attack animation frame
- **player-victory.png**: Victory celebration pose
- **player-hurt.png**: Damage taken reaction
- **player-charge.png**: Charging/preparing attack pose

### Visual Style Guidelines
- **Lighting**: Consistent light source from upper-left
- **Contrast**: High contrast for visibility at small sizes
- **Detail Level**: Moderate detail - readable at 120px width
- **Equipment**: Include basic gear (sword, armor, etc.) if character has stats > 2

## Monster Sprite Requirements

### Dimensions & Format
- **Resolution**: 140x140 pixels (minimum), 280x280 pixels (recommended for HD)
- **Aspect Ratio**: 1:1 (square)
- **Format**: PNG-24 with alpha transparency (preferred) or high-quality JPG
- **Color Depth**: 24-bit or 32-bit (with alpha)

### Character Positioning
- **Orientation**: Facing left (towards player side)
- **Centering**: Monster centered in frame, may fill more space than player
- **Stance**: Aggressive or threatening pose appropriate to creature type
- **Size Scaling**: Larger/more dangerous monsters should appear bigger in frame

### Monster Type Guidelines

#### Slime Monsters
- **Shape**: Organic, blob-like with slight translucency effects
- **Colors**: Bright green, blue, or purple
- **Features**: Large expressive eyes, possible bubbles or dripping effects
- **Size**: Medium, rounded bottom sitting on ground

#### Goblin Monsters  
- **Build**: Humanoid, shorter than player, muscular
- **Features**: Pointed ears, fangs, fierce expression
- **Colors**: Green skin tones, brown leather gear
- **Weapons**: Crude clubs, rusty daggers, or primitive spears
- **Posture**: Hunched, aggressive stance

#### Beast Monsters (Rats, Spiders, etc.)
- **Anatomy**: Realistic animal proportions
- **Detail**: Visible fur/chitin textures where appropriate
- **Eyes**: Menacing, often red or yellow
- **Size**: Scale according to threat level
- **Pose**: Ready to pounce or attack

#### Demon/Orc Monsters
- **Build**: Large, muscular humanoid
- **Features**: Horns, fangs, scars, glowing eyes
- **Colors**: Red, dark gray, or black skin tones
- **Equipment**: Heavy weapons, metal armor pieces
- **Presence**: Should look intimidating and powerful

## Technical Implementation

### File Naming Convention
```
player.png                    # Main player character
monster-slime.png            # Basic slime enemy
monster-cave-goblin.png      # Goblin in caves
monster-giant-rat.png        # Large rat enemy
monster-web-spider.png       # Spider creature
monster-orc-warrior.png      # Generic orc enemy
monster-fire-demon.png       # Demon-type enemy
```

### Sprite Loading Order
1. System attempts to load custom sprite from `/public/sprites/`
2. If custom sprite fails to load, falls back to generated sprite
3. Generated sprites use advanced canvas techniques with gradients and effects
4. All sprites are cached for performance

### Performance Considerations
- **File Size**: Keep under 50KB per sprite for fast loading
- **Compression**: Use PNG compression or high-quality JPG (85%+)
- **Transparency**: Use alpha channel sparingly to reduce file size
- **Multiple Formats**: Consider providing both PNG and WebP versions

### Animation Support (Future)
When sprite sheet animation is implemented:
- **Frame Count**: 2-8 frames for idle animations
- **Layout**: Horizontal sprite strip (frames side by side)
- **Timing**: Each frame should work at 0.5-2 second intervals
- **File Naming**: `player-sheet-4frames.png` (4 animation frames)

## Quality Checklist

Before adding your sprites, verify:
- [ ] Correct dimensions and aspect ratio
- [ ] Proper orientation (player right, monster left)  
- [ ] Consistent lighting and style across all sprites
- [ ] Readable details at display size
- [ ] Appropriate transparency/background
- [ ] Proper file naming convention
- [ ] File size under 50KB
- [ ] Colors work well against battle background
- [ ] Character personality comes through in pose/expression

## Common Issues & Solutions

### Sprite Appears Blurry
- Increase source resolution to 2x target size
- Check image interpolation settings
- Use PNG instead of JPG for sharp edges

### Character Too Small/Large in Battle
- Adjust character size within the frame boundaries
- Leave appropriate padding around character
- Consider the character's relative power level

### Sprite Doesn't Load
- Check file path: `/public/sprites/[filename]`
- Verify file naming convention
- Check browser console for error messages
- Ensure file permissions allow reading

### Style Inconsistency
- Use same lighting direction across all sprites
- Maintain consistent color palette
- Match detail level between player and monsters
- Keep line weight/art style consistent