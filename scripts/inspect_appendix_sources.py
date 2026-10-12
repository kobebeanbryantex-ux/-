"""Read-only inspection of local anatomical source meshes."""
import bpy
import json
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    Path(r'C:\Users\wuhaotian\Desktop\Z-Anatomy-PC-Version\Resources\Models\FBX\VisceralSystem100.fbx'),
    ROOT / 'EUS_手术解说工具/06_前端项目/public/models/digestive_system.glb',
]
for source in SOURCES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if source.suffix == '.fbx':
        bpy.ops.import_scene.fbx(filepath=str(source))
    else:
        bpy.ops.import_scene.gltf(filepath=str(source))
    rows = []
    for obj in bpy.data.objects:
        if obj.type != 'MESH':
            continue
        if source.suffix == '.fbx' and not any(s in obj.name.lower() for s in ['cecum', 'caecum', 'appendix', 'ileoc', 'ileocae']):
            continue
        corners = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
        lo = [min(v[i] for v in corners) for i in range(3)]
        hi = [max(v[i] for v in corners) for i in range(3)]
        rows.append(dict(name=obj.name, vertices=len(obj.data.vertices), triangles=sum(len(p.vertices)-2 for p in obj.data.polygons), min=lo, max=hi, materials=[m.name for m in obj.data.materials if m]))
    print('SOURCE_INSPECTION ' + json.dumps(dict(source=str(source), meshes=rows), ensure_ascii=False))
