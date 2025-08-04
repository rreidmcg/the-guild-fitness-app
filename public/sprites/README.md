# Custom Sprite Guide for The Guild: Gamified Fitness

## Quick Setup
Drop your custom sprite files into the `/public/sprites/` directory and they'll automatically be used in battles!

## File Requirements

### Player Sprites
- **Filename**: `player.png`
- **Dimensions**: 120x160 pixels (3:4 ratio)
- **Format**: PNG with transparency (recommended) or JPG
- **Style**: Any style you want - realistic, cartoon, pixel art, etc.

### Monster Sprites
- **Filename Pattern**: `monster-[name].png`
- **Examples**: 
  - `monster-slime.png`
  - `monster-goblin.png`
  - `monster-giant-rat.png`
  - `monster-cave-spider.png`
- **Dimensions**: 140x140 pixels (square)
- **Format**: PNG with transparency (recommended) or JPG

## Character Design Tips

### For Player Sprites:
- Design facing right (towards the enemy)
- Leave some space around the character for animations
- Consider the character will be scaled and animated
- Include equipment/gear variations if desired

### For Monster Sprites:
- Design facing left (towards the player)
- Make them look menacing and distinctive
- Larger monsters should fill more of the frame
- Consider the creature's personality and threat level

## Advanced Options

### Sprite Sheets (Coming Soon)
If you want animation frames, you can create sprite sheets:
- **Player**: `player-sheet.png` (multiple frames horizontally)
- **Monster**: `monster-[name]-sheet.png`
- Define frame count in the filename: `player-sheet-4frames.png`

### Custom Sizes
The system will automatically scale sprites to fit, but for best quality:
- Use 2x resolution: 240x320 for players, 280x280 for monsters
- High DPI displays will look crisp

## Fallback System
If custom sprites aren't found, the system automatically uses the built-in realistic generated sprites. This means you can:
- Add sprites gradually (just player, or just specific monsters)
- Mix custom and generated sprites
- Remove sprites anytime to return to generated ones

## File Organization
```
public/sprites/
├── player.png                    # Your hero character
├── monster-slime.png            # Green slime enemy  
├── monster-goblin.png           # Goblin warrior
├── monster-giant-rat.png        # Rat creature
├── monster-cave-spider.png      # Spider enemy
└── monster-orc-warrior.png      # Default orc enemy
```

## Testing Your Sprites
1. Add your sprite files to `/public/sprites/`
2. Start a battle in the app
3. Your custom sprites will automatically appear!
4. If a sprite doesn't load, check the browser console for error messages

## Character Consistency
For the best experience, keep a consistent art style across all your sprites. The game will look most polished when all characters match in:
- Art style (realistic, cartoon, pixel art)
- Color palette  
- Lighting direction
- Level of detail

Happy sprite creating! 🎨