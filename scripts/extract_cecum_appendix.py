"""Extract native Z-Anatomy cecal pouch and appendix; align to the existing atlas.

Run with Blender --background --python scripts/extract_cecum_appendix.py.
Source meshes are preserved, with a documented superior crop of the ascending
colon to retain only the cecum and its short colonic continuation.
"""
import bpy
import bmesh
import json
import base64
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:\Users\wuhaotian\Desktop\Z-Anatomy-PC-Version\Resources\Models\FBX\VisceralSystem100.fbx')
REFERENCE = ROOT / 'EUS_手术解说工具/06_前端项目/public/models/digestive_system.glb'
OUT = ROOT / 'media/models/cecum_appendix'
OUT.mkdir(parents=True, exist_ok=True)

def bounds(obj):
    points = [obj.matrix_world @ v.co for v in obj.data.vertices]
    return Vector(tuple(min(p[i] for p in points) for i in range(3))), Vector(tuple(max(p[i] for p in points) for i in range(3)))

def make_material(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = .43
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Coat Weight'].default_value = .12
    return mat

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(REFERENCE))
reference_lo, reference_hi = bounds(bpy.data.objects['Organ_Stomach_Full'])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(SOURCE))
source_lo, source_hi = bounds(bpy.data.objects['Stomach'])
source_size = source_hi-source_lo
ratios = Vector(tuple((reference_hi[i]-reference_lo[i])/source_size[i] for i in range(3)))
assert max(ratios)-min(ratios) < 1e-4, 'Reference stomach must retain a uniform native transform'
scale = sum(ratios)/3
offset = reference_lo-source_lo*scale

names = [('Ascending colon', 'Organ_Cecum'), ('Vermiform appendix', 'Organ_Appendix'), ('Meso-appendix', 'Organ_Mesoappendix')]
keep = [bpy.data.objects[a] for a, _ in names]
for obj in list(bpy.data.objects):
    if obj not in keep:
        bpy.data.objects.remove(obj, do_unlink=True)

cecum = keep[0]
for obj in keep:
    obj.data.transform(obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)

# Native ascending-colon mesh includes the blind cecal pouch. Keep its lower
# 7.6 cm, rather than adding an invented sphere. Cap the superior display cut.
cut_z = .998
bm = bmesh.new()
bm.from_mesh(cecum.data)
bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces), dist=1e-7,
                      plane_co=Vector((0,0,cut_z)), plane_no=Vector((0,0,1)), clear_outer=True)
cut_edges = [e for e in bm.edges if e.is_boundary and all(abs(v.co.z-cut_z)<1e-5 for v in e.verts)]
if cut_edges:
    bmesh.ops.holes_fill(bm, edges=cut_edges, sides=0)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.to_mesh(cecum.data)
bm.free()

# Linear-space colors; chosen to match the existing reddish-brown bowel palette.
materials = [make_material('Cecum_serosa', (.39,.085,.055)),
             make_material('Appendix_serosa', (.44,.10,.065)),
             make_material('Mesoappendix', (.50,.25,.12))]
stats = []
for (old_name, new_name), obj, mat in zip(names, keep, materials):
    obj.name = new_name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    if new_name == 'Organ_Cecum':
        bpy.context.view_layer.objects.active = obj
        mod = obj.modifiers.new('Smooth native cecal surface', 'SUBSURF')
        mod.levels = 1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    elif new_name == 'Organ_Appendix':
        bpy.context.view_layer.objects.active = obj
        mod = obj.modifiers.new('Smooth native appendix surface', 'SUBSURF')
        mod.levels = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    elif new_name == 'Organ_Mesoappendix':
        bpy.context.view_layer.objects.active = obj
        mod = obj.modifiers.new('Smooth native mesoappendix surface', 'SUBSURF')
        mod.levels = 1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    for vertex in obj.data.vertices:
        vertex.co = vertex.co*scale+offset
    obj['source'] = 'Z-Anatomy / VisceralSystem100.fbx / ' + old_name
    obj['license'] = 'CC-BY-SA-4.0'
    lo, hi = bounds(obj)
    stats.append(dict(name=new_name, source=old_name, vertices=len(obj.data.vertices), min=list(lo), max=list(hi)))

# The point is at the appendiceal root (closest surface region to the cecum),
# not an arbitrary screen percentage or a point on the distal appendix tip.
from mathutils.bvhtree import BVHTree
bvh = BVHTree.FromObject(cecum, bpy.context.evaluated_depsgraph_get())
appendix = keep[1]
root_candidates = sorted(appendix.data.vertices, key=lambda v: bvh.find_nearest(v.co)[3])[:24]
root_center = sum((v.co for v in root_candidates), Vector())/len(root_candidates)
root_point = min(root_candidates, key=lambda v: (v.co-root_center).length).co
# glTF converts Blender Z-up into Three.js Y-up.
anchor = [root_point.x, root_point.z, -root_point.y]

bpy.ops.object.select_all(action='DESELECT')
for obj in keep:
    obj.select_set(True)
bpy.context.view_layer.objects.active = cecum
model_path = OUT / 'cecum_appendix.glb'
bpy.ops.export_scene.gltf(filepath=str(model_path), export_format='GLB', use_selection=True,
                          export_yup=True, export_apply=True, export_extras=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'cecum_appendix.blend'))
metadata = dict(source=str(SOURCE), license='CC-BY-SA-4.0', scale=scale, translation=list(offset),
                sourceCropSuperiorZ=cut_z, anchor=anchor, meshes=stats)
(OUT / 'provenance.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf8')
payload = dict(version='20260928-native-1', anchor=anchor,
               base64=base64.b64encode(model_path.read_bytes()).decode('ascii'))
(OUT / 'cecum_appendix.data.js').write_text('/* Z-Anatomy derivative, CC BY-SA 4.0. See SOURCE.md. */\nwindow.CecumAppendixAsset = '+json.dumps(payload,separators=(',',':'))+';\n', encoding='utf8')
print('EXTRACTED_CECUM_APPENDIX ' + json.dumps(metadata))
