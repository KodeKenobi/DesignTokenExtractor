#!/usr/bin/env python3
"""
Generate icons for Design Token Extractor Chrome Extension
Requires: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not installed. Install it with: pip install Pillow")
    exit(1)

def create_icon(size):
    """Create an icon with design token symbol"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient effect (simplified - solid color with design elements)
    # Draw 3 overlapping squares to represent design tokens
    padding = int(size * 0.15)
    square_size = int(size * 0.25)
    
    # Square 1 (top-left) - white with transparency effect
    draw.rectangle(
        [padding, padding, padding + square_size, padding + square_size],
        fill='white'
    )
    
    # Square 2 (center)
    center = size // 2
    draw.rectangle(
        [center - square_size // 2, center - square_size // 2,
         center + square_size // 2, center + square_size // 2],
        fill='white'
    )
    
    # Square 3 (bottom-right)
    bottom_right = size - padding - square_size
    draw.rectangle(
        [bottom_right, bottom_right,
         bottom_right + square_size, bottom_right + square_size],
        fill='white'
    )
    
    return img

def main():
    sizes = [16, 32, 48, 128]
    icons_dir = 'icons'
    
    import os
    os.makedirs(icons_dir, exist_ok=True)
    
    print("Generating icons...")
    for size in sizes:
        icon = create_icon(size)
        filename = f"{icons_dir}/icon{size}.png"
        icon.save(filename, 'PNG')
        print(f"✓ Created {filename} ({size}x{size})")
    
    print("\nAll icons generated successfully!")
    print(f"Icons saved in: {os.path.abspath(icons_dir)}")

if __name__ == '__main__':
    main()

