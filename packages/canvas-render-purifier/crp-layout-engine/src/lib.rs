use wasm_bindgen::prelude::*;
use taffy::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

mod font_engine;
mod ai_optimizer;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LayoutNodeInput {
    pub id: String,
    pub flex_direction: Option<String>,
    pub justify_content: Option<String>,
    pub align_items: Option<String>,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub padding: Option<f32>,
    pub margin: Option<f32>,
    pub children: Vec<LayoutNodeInput>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LayoutResult {
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub children: Vec<LayoutResult>,
}

#[wasm_bindgen]
pub struct LayoutEngine {
    taffy: Taffy,
}

#[wasm_bindgen]
impl LayoutEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        LayoutEngine {
            taffy: Taffy::new(),
        }
    }

    pub fn compute_layout(&mut self, input: JsValue) -> JsValue {
        let node_input: LayoutNodeInput = serde_wasm_bindgen::from_value(input).unwrap();
        let mut node_map = HashMap::new();
        
        let root_handle = self.build_taffy_tree(&node_input, &mut node_map);
        
        self.taffy.compute_layout(
            root_handle,
            Size {
                width: AvailableSpace::Definite(1024.0),
                height: AvailableSpace::Definite(768.0),
            },
        ).unwrap();

        let result = self.extract_results(root_handle, &node_input, &node_map);
        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    fn build_taffy_tree(
        &mut self,
        input: &LayoutNodeInput,
        node_map: &mut HashMap<String, Node>,
    ) -> Node {
        let mut child_nodes = Vec::new();
        for child in &input.children {
            child_nodes.push(self.build_taffy_tree(child, node_map));
        }

        // Configure layout styles utilizing Taffy styles
        let flex_direction = match input.flex_direction.as_deref() {
            Some("row") => FlexDirection::Row,
            _ => FlexDirection::Column,
        };

        let style = Style {
            display: Display::Flex,
            flex_direction,
            size: Size {
                width: input.width.map(|w| Dimension::Points(w)).unwrap_or(Dimension::Auto),
                height: input.height.map(|h| Dimension::Points(h)).unwrap_or(Dimension::Auto),
            },
            padding: Rect {
                left: LengthPercentage::Points(input.padding.unwrap_or(0.0)),
                right: LengthPercentage::Points(input.padding.unwrap_or(0.0)),
                top: LengthPercentage::Points(input.padding.unwrap_or(0.0)),
                bottom: LengthPercentage::Points(input.padding.unwrap_or(0.0)),
            },
            margin: Rect {
                left: LengthPercentageAuto::Points(input.margin.unwrap_or(0.0)),
                right: LengthPercentageAuto::Points(input.margin.unwrap_or(0.0)),
                top: LengthPercentageAuto::Points(input.margin.unwrap_or(0.0)),
                bottom: LengthPercentageAuto::Points(input.margin.unwrap_or(0.0)),
            },
            ..Default::default()
        };

        let node = self.taffy.new_with_children(style, &child_nodes).unwrap();
        node_map.insert(input.id.clone(), node);
        node
    }

    fn extract_results(
        &self,
        node: Node,
        input: &LayoutNodeInput,
        node_map: &HashMap<String, Node>,
    ) -> LayoutResult {
        let taffy_node = node_map.get(&input.id).unwrap();
        let layout = self.taffy.layout(*taffy_node).unwrap();

        let mut child_results = Vec::new();
        for child in &input.children {
            child_results.push(self.extract_results(node, child, node_map));
        }

        LayoutResult {
            id: input.id.clone(),
            x: layout.location.x,
            y: layout.location.y,
            width: layout.size.width,
            height: layout.size.height,
            children: child_results,
        }
    }
}
