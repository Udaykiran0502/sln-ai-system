import json
import pytest
from backend.utils.scene_graph import SceneGraph, RootNode, GroupNode, TextNode, ImageNode, ShapeNode, Transform, Bounds

def test_scene_graph_creation():
    sg = SceneGraph()
    assert isinstance(sg.root, RootNode)
    assert sg.root.type == 'RootNode'

def test_dirty_flag_propagation():
    sg = SceneGraph()
    group = GroupNode(name="BackgroundGroup")
    text = TextNode(name="Heading", text_content="Hello")
    
    sg.root.add_child(group)
    group.add_child(text)
    
    # Mark all clean
    sg.mark_all_clean()
    assert not sg.root.dirty
    assert not group.dirty
    assert not text.dirty
    
    # Mutating the text node's property doesn't automatically trigger the property setter
    # in standard dataclasses unless we use custom setters, but calling mark_dirty() works.
    text.text_content = "World"
    text.mark_dirty()
    
    assert text.dirty
    assert group.dirty
    assert sg.root.dirty

def test_serialization():
    sg = SceneGraph()
    group = GroupNode(name="Content")
    text = TextNode(name="Title", text_content="SLN Digitals")
    text.transform = Transform(x=10, y=20)
    image = ImageNode(name="Hero", image_path="hero.jpg")
    
    sg.root.add_child(group)
    group.add_child(text)
    group.add_child(image)
    
    json_str = sg.to_json()
    
    # Deserialization
    sg2 = SceneGraph.from_json(json_str)
    
    assert sg2.root.type == 'RootNode'
    assert len(sg2.root.children) == 1
    
    g2 = sg2.root.children[0]
    assert g2.type == 'GroupNode'
    assert g2.name == 'Content'
    assert len(g2.children) == 2
    
    t2, i2 = g2.children
    assert t2.type == 'TextNode'
    assert t2.name == 'Title'
    assert t2.text_content == 'SLN Digitals'
    assert t2.transform.x == 10
    
    assert i2.type == 'ImageNode'
    assert i2.image_path == 'hero.jpg'
