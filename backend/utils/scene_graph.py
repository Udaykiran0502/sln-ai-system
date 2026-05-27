import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Union, ClassVar
import uuid

@dataclass
class Transform:
    x: float = 0.0
    y: float = 0.0
    rotation: float = 0.0
    scale_x: float = 1.0
    scale_y: float = 1.0

@dataclass
class Bounds:
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0

@dataclass
class SceneNode:
    type: str = field(init=False)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    transform: Transform = field(default_factory=Transform)
    bounds: Bounds = field(default_factory=Bounds)
    z_index: int = 0
    visible: bool = True
    locked: bool = False
    dirty: bool = True
    children: List['SceneNode'] = field(default_factory=list)
    _parent: Optional['SceneNode'] = field(default=None, repr=False, init=False)

    def mark_dirty(self):
        """Mark this node and all ancestors as dirty."""
        self.dirty = True
        if self._parent:
            self._parent.mark_dirty()
            
    def add_child(self, child: 'SceneNode'):
        self.children.append(child)
        child._parent = self
        self.mark_dirty()

    def remove_child(self, child: 'SceneNode'):
        if child in self.children:
            self.children.remove(child)
            child._parent = None
            self.mark_dirty()

    def to_dict(self) -> Dict[str, Any]:
        d = {
            'type': self.type,
            'id': self.id,
            'name': self.name,
            'transform': asdict(self.transform),
            'bounds': asdict(self.bounds),
            'z_index': self.z_index,
            'visible': self.visible,
            'locked': self.locked,
            'dirty': self.dirty,
            'children': [c.to_dict() for c in self.children]
        }
        # Add subclass-specific fields
        if hasattr(self, 'text_content'):
            d['text_content'] = self.text_content
            d['font_path'] = self.font_path
            d['font_size'] = self.font_size
            d['color'] = self.color
            d['alignment'] = self.alignment
            d['language'] = self.language
        elif hasattr(self, 'image_path'):
            d['image_path'] = self.image_path
            d['crop_rect'] = self.crop_rect
            d['opacity'] = self.opacity
            d['fit_mode'] = self.fit_mode
        elif hasattr(self, 'shape_type'):
            d['shape_type'] = self.shape_type
            d['fill_color'] = self.fill_color
            d['stroke_color'] = self.stroke_color
            d['stroke_width'] = self.stroke_width
            
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SceneNode':
        node_type = data.get('type')
        if node_type == 'RootNode':
            node_class = RootNode
        elif node_type == 'GroupNode':
            node_class = GroupNode
        elif node_type == 'TextNode':
            node_class = TextNode
        elif node_type == 'ImageNode':
            node_class = ImageNode
        elif node_type == 'ShapeNode':
            node_class = ShapeNode
        else:
            node_class = SceneNode

        kwargs = {k: v for k, v in data.items() if k not in ['type', 'children', 'transform', 'bounds']}
        
        if 'transform' in data and data['transform']:
            kwargs['transform'] = Transform(**data['transform'])
        if 'bounds' in data and data['bounds']:
            kwargs['bounds'] = Bounds(**data['bounds'])

        node = node_class(**kwargs)
        for child_data in data.get('children', []):
            node.add_child(SceneNode.from_dict(child_data))
        return node

@dataclass
class RootNode(SceneNode):
    def __post_init__(self):
        self.type = 'RootNode'

@dataclass
class GroupNode(SceneNode):
    def __post_init__(self):
        self.type = 'GroupNode'

@dataclass
class TextNode(SceneNode):
    text_content: str = ""
    font_path: str = ""
    font_size: int = 24
    color: str = "#000000"
    alignment: str = "left"
    language: str = "english"

    def __post_init__(self):
        self.type = 'TextNode'

@dataclass
class ImageNode(SceneNode):
    image_path: str = ""
    crop_rect: Optional[List[float]] = None
    opacity: float = 1.0
    fit_mode: str = "cover"

    def __post_init__(self):
        self.type = 'ImageNode'

@dataclass
class ShapeNode(SceneNode):
    shape_type: str = "rectangle"  # rectangle, circle, line
    fill_color: str = "#FFFFFF"
    stroke_color: str = "#000000"
    stroke_width: float = 0.0

    def __post_init__(self):
        self.type = 'ShapeNode'

class SceneGraph:
    def __init__(self, root: Optional[RootNode] = None):
        self.root = root or RootNode()

    def mark_all_clean(self):
        def _clean(node: SceneNode):
            node.dirty = False
            for child in node.children:
                _clean(child)
        _clean(self.root)

    def to_json(self) -> str:
        return json.dumps(self.root.to_dict(), indent=2)

    @classmethod
    def from_json(cls, json_str: str) -> 'SceneGraph':
        data = json.loads(json_str)
        root = SceneNode.from_dict(data)
        if not isinstance(root, RootNode):
            raise ValueError("Root element is not a RootNode")
        return cls(root=root)
