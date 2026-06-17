use std::collections::HashMap;

pub struct LayoutOptimizer {
    update_history: HashMap<String, usize>,
}

impl LayoutOptimizer {
    pub fn new() -> Self {
        LayoutOptimizer {
            update_history: HashMap::new(),
        }
    }

    // Records update hits to feed pre-emptive layout rasterization caches
    pub fn record_update(&mut self, node_id: &str) {
        let count = self.update_history.entry(node_id.to_string()).or_insert(0);
        *count += 1;
    }

    // Predicts whether a node is likely to change layout bounds soon (e.g. high frequency nodes)
    pub fn predict_volatility(&self, node_id: &str) -> f32 {
        if let Some(&count) = self.update_history.get(node_id) {
            if count > 50 {
                return 0.95; // High volatility
            }
            if count > 10 {
                return 0.45; // Medium volatility
            }
        }
        0.05 // Low volatility
    }
}
