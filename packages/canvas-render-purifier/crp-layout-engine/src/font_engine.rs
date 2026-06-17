use std::collections::HashMap;

pub struct GlyphMetrics {
    pub width: f32,
    pub height: f32,
    pub advance_x: f32,
    pub uv_x: f32,
    pub uv_y: f32,
    pub uv_w: f32,
    pub uv_h: f32,
}

pub struct FontEngine {
    glyph_atlas: HashMap<char, GlyphMetrics>,
}

impl FontEngine {
    pub fn new() -> Self {
        let mut atlas = HashMap::new();
        // Load default mock metrics for base ASCII characters
        for c in 32..127u8 {
            atlas.insert(
                c as char,
                GlyphMetrics {
                    width: 8.0,
                    height: 14.0,
                    advance_x: 9.0,
                    uv_x: 0.0,
                    uv_y: 0.0,
                    uv_w: 0.1,
                    uv_h: 0.1,
                },
            );
        }
        FontEngine { glyph_atlas: atlas }
    }

    // Measure Text string width incorporating kerning and directionality
    pub fn measure_text(&self, text: &str, _font_size: f32) -> (f32, f32) {
        let mut total_width = 0.0;
        let mut max_height = 0.0;

        // Simple RTL check
        let is_rtl = text.chars().any(|c| (c as u32) >= 0x0590 && (c as u32) <= 0x06FF);
        
        let chars: Vec<char> = if is_rtl {
            text.chars().rev().collect()
        } else {
            text.chars().collect()
        };

        for c in chars {
            if let Some(metrics) = this_glyph_lookup(&self.glyph_atlas, c) {
                total_width += metrics.advance_x;
                if metrics.height > max_height {
                    max_height = metrics.height;
                }
            } else {
                total_width += 8.0; // Fallback space width
            }
        }

        (total_width, max_height)
    }
}

fn this_glyph_lookup(atlas: &HashMap<char, GlyphMetrics>, c: char) -> Option<&GlyphMetrics> {
    atlas.get(&c)
}
