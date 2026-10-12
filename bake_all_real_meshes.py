"""
=============================================================================
EUS 手术解说工具 · 真实 GLB 网格完整烘焙导出脚本
=============================================================================
导入 02_器官模型/ 下的全部真实网格：
1. 肝脏 (liver.glb, 21.4万面真实高精模型)
2. 胰腺 (pancreas.glb, 18.6万面真实高精模型)
3. 胃 (stomach_z_anatomy.glb, Z-Anatomy 真实J形胃囊)
4. 食管 (esophagus_z_anatomy.glb)
5. 胆囊 (gallbladder_z_anatomy.glb)
6. 胆总管 (bile_duct_z_anatomy.glb)
7. 空肠 (jejunum_z_anatomy.glb / 精炼顺滑肠袢)
8. 4 大 3D 实体手术支架 (EUS-GE, EUS-HGS, EUS-CDS, EUS-PD)

导出为单一标准 GLB，彻底解决浏览器端独立解码器失效问题！
=============================================================================
"""

import bpy
import os
import math
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = SCRIPT_DIR
MODELS_DIR = os.path.join(PROJECT_ROOT, "EUS_手术解说工具", "02_器官模型")
EXPORT_DIR = os.path.join(PROJECT_ROOT, "EUS_手术解说工具", "06_前端项目", "public", "models")
EXPORT_GLB_PATH = os.path.join(EXPORT_DIR, "digestive_system.glb")

def hex_to_linear_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0
    to_linear = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (to_linear(r), to_linear(g), to_linear(b), 1.0)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        if block.users == 0: bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0: bpy.data.materials.remove(block)

def create_pbr_mat(name, hex_color, alpha=1.0, roughness=0.35, transmission=0.0, metallic=0.0, emission_hex=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=f"Mat_{name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    bsdf = None
    output = None
    for n in nodes:
        if n.type == 'BSDF_PRINCIPLED': bsdf = n
        elif n.type == 'OUTPUT_MATERIAL': output = n
    if not bsdf: bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    if not output: output = nodes.new(type="ShaderNodeOutputMaterial")
    if not bsdf.outputs["BSDF"].is_linked:
        links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    
    base_color = hex_to_linear_rgb(hex_color)
    if "Base Color" in bsdf.inputs: bsdf.inputs["Base Color"].default_value = base_color
    if "Roughness" in bsdf.inputs: bsdf.inputs["Roughness"].default_value = roughness
    if "Alpha" in bsdf.inputs: bsdf.inputs["Alpha"].default_value = alpha
    if "Metallic" in bsdf.inputs: bsdf.inputs["Metallic"].default_value = metallic
    
    if "Transmission Weight" in bsdf.inputs: bsdf.inputs["Transmission Weight"].default_value = transmission
    elif "Transmission" in bsdf.inputs: bsdf.inputs["Transmission"].default_value = transmission

    if emission_hex and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = hex_to_linear_rgb(emission_hex)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength

    if alpha < 1.0 or transmission > 0:
        if hasattr(mat, "blend_method"): mat.blend_method = 'BLEND'
        if hasattr(mat, "shadow_method"): mat.shadow_method = 'HASHED'

    return mat

def get_objects_bounding_box(objects):
    min_co = Vector((float('inf'), float('inf'), float('inf')))
    max_co = Vector((float('-inf'), float('-inf'), float('-inf')))
    has_mesh = False

    for obj in objects:
        if obj.type == 'MESH' and obj.data and len(obj.data.vertices) > 0:
            has_mesh = True
            for corner in obj.bound_box:
                world_corner = obj.matrix_world @ Vector(corner)
                min_co.x = min(min_co.x, world_corner.x)
                min_co.y = min(min_co.y, world_corner.y)
                min_co.z = min(min_co.z, world_corner.z)
                max_co.x = max(max_co.x, world_corner.x)
                max_co.y = max(max_co.y, world_corner.y)
                max_co.z = max(max_co.z, world_corner.z)

    if not has_mesh: return Vector((0, 0, 0)), Vector((1, 1, 1))
    return (min_co + max_co) / 2.0, max_co - min_co

def import_glb(filepath):
    existing_objs = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=filepath)
    return [o for o in bpy.data.objects if o not in existing_objs]

def move_to_col(obj, target_col):
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    target_col.objects.link(obj)

def create_curve_tube(name, points, bevel_depth, mat, target_col):
    curve_data = bpy.data.curves.new(name=name, type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = bevel_depth
    curve_data.bevel_resolution = 10
    curve_data.use_fill_caps = True

    polyline = curve_data.splines.new('BEZIER')
    polyline.bezier_points.add(len(points) - 1)
    for i, p in enumerate(points):
        bp = polyline.bezier_points[i]
        bp.co = p
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    obj = bpy.data.objects.new(name=name, object_data=curve_data)
    target_col.objects.link(obj)
    
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.data.materials.append(mat)
    return obj

def run():
    print("🚀 正在载入全部真实 3D 模型并生成完美 1:1 复合解剖场景...")
    clear_scene()

    organ_col = bpy.data.collections.new("Real_Organs")
    stent_col = bpy.data.collections.new("Surgical_Stents")
    bpy.context.scene.collection.children.link(organ_col)
    bpy.context.scene.collection.children.link(stent_col)

    all_meshes = []

    # 1. 真实肝脏 (liver.glb, 21.4万面高精网格)
    p_liver = os.path.join(MODELS_DIR, "肝脏", "liver.glb")
    objs_liver = import_glb(p_liver)
    mat_liver = create_pbr_mat("Liver_RedBrown", "#9E2B25", alpha=0.92, roughness=0.35)
    for o in objs_liver:
        move_to_col(o, organ_col)
        if o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat_liver)
    
    bpy.context.view_layer.update()
    c, s = get_objects_bounding_box([o for o in objs_liver if o.type == 'MESH'])
    scale_ratio = 2.4 / max(s.x, s.y, s.z, 0.001)
    for o in objs_liver:
        if o.type == 'MESH':
            o.scale *= scale_ratio
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_liver if o.type == 'MESH'])
    offset = Vector((-1.35, 1.05, 0.0)) - c
    for o in objs_liver:
        if o.type == 'MESH':
            o.location += offset
            all_meshes.append(o)
    print("✓ 真实肝脏网格装配完成")

    # 2. 真实胰腺 (pancreas.glb, 18.6万面高精网格)
    p_pancreas = os.path.join(MODELS_DIR, "胰腺", "pancreas.glb")
    objs_pancreas = import_glb(p_pancreas)
    mat_pancreas = create_pbr_mat("Pancreas_Yellow", "#F4D06F", alpha=0.88, roughness=0.4)
    for o in objs_pancreas:
        move_to_col(o, organ_col)
        if o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat_pancreas)

    bpy.context.view_layer.update()
    c, s = get_objects_bounding_box([o for o in objs_pancreas if o.type == 'MESH'])
    scale_ratio = 1.85 / max(s.x, s.y, s.z, 0.001)
    for o in objs_pancreas:
        if o.type == 'MESH':
            o.scale *= scale_ratio
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_pancreas if o.type == 'MESH'])
    offset = Vector((-0.20, -0.15, 0.05)) - c
    for o in objs_pancreas:
        if o.type == 'MESH':
            o.location += offset
            all_meshes.append(o)
    print("✓ 真实胰腺网格装配完成")

    # 3. 真实胃 (stomach_z_anatomy.glb, Z-Anatomy 真实医学J形胃囊)
    p_stomach = os.path.join(MODELS_DIR, "胃", "stomach_z_anatomy.glb")
    objs_stomach = import_glb(p_stomach)
    mat_stomach = create_pbr_mat("Stomach_Pink", "#FFAAA6", alpha=0.80, roughness=0.32, transmission=0.15)
    for o in objs_stomach:
        move_to_col(o, organ_col)
        if o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat_stomach)

    bpy.context.view_layer.update()
    c, s = get_objects_bounding_box([o for o in objs_stomach if o.type == 'MESH'])
    scale_ratio = 1.85 / max(s.x, s.y, s.z, 0.001)
    for o in objs_stomach:
        if o.type == 'MESH':
            o.scale *= scale_ratio
            o.rotation_euler = (0.0, 0.0, -0.20)
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_stomach if o.type == 'MESH'])
    offset = Vector((0.85, 0.55, 0.15)) - c
    for o in objs_stomach:
        if o.type == 'MESH':
            o.location += offset
            all_meshes.append(o)
    print("✓ 真实胃部网格装配完成")

    # 4. 真实食管 (esophagus_z_anatomy.glb)
    p_esoph = os.path.join(MODELS_DIR, "食管", "esophagus_z_anatomy.glb")
    objs_esoph = import_glb(p_esoph)
    mat_esoph = create_pbr_mat("Esophagus_Pink", "#F0A8B8", alpha=0.85, roughness=0.3)
    for o in objs_esoph:
        move_to_col(o, organ_col)
        if o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat_esoph)
            
    bpy.context.view_layer.update()
    c, s = get_objects_bounding_box([o for o in objs_esoph if o.type == 'MESH'])
    scale_ratio = 1.25 / max(s.x, s.y, s.z, 0.001)
    for o in objs_esoph:
        if o.type == 'MESH':
            o.scale *= scale_ratio
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_esoph if o.type == 'MESH'])
    offset = Vector((0.40, 1.60, 0.00)) - c
    for o in objs_esoph:
        if o.type == 'MESH':
            o.location += offset
            all_meshes.append(o)
    print("✓ 真实食管网格装配完成")

    # 5. 真实胆囊 (gallbladder_z_anatomy.glb)
    p_gb = os.path.join(MODELS_DIR, "胆囊", "gallbladder_z_anatomy.glb")
    objs_gb = import_glb(p_gb)
    mat_gb = create_pbr_mat("Gallbladder_Green", "#2E7D32", alpha=0.95, roughness=0.25)
    for o in objs_gb:
        move_to_col(o, organ_col)
        if o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat_gb)
            
    bpy.context.view_layer.update()
    c, s = get_objects_bounding_box([o for o in objs_gb if o.type == 'MESH'])
    scale_ratio = 0.55 / max(s.x, s.y, s.z, 0.001)
    for o in objs_gb:
        if o.type == 'MESH':
            o.scale *= scale_ratio
            o.rotation_euler = (0.0, 0.0, -0.5)
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_gb if o.type == 'MESH'])
    offset = Vector((-1.25, 0.25, 0.22)) - c
    for o in objs_gb:
        if o.type == 'MESH':
            o.location += offset
            all_meshes.append(o)
    print("✓ 真实胆囊网格装配完成")

    # 6. 真实胆总管 (bile_duct_z_anatomy.glb)
    p_cbd = os.path.join(MODELS_DIR, "胆总管", "bile_duct_z_anatomy.glb")
    objs_cbd = import_glb(p_cbd)
    mat_cbd = create_pbr_mat("CBD_Yellow", "#FBC02D", alpha=0.98, roughness=0.22)
    for o in objs_cbd:
        move_to_col(o, organ_col)
        if o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat_cbd)
            
    bpy.context.view_layer.update()
    c, s = get_objects_bounding_box([o for o in objs_cbd if o.type == 'MESH'])
    scale_ratio = 1.05 / max(s.x, s.y, s.z, 0.001)
    for o in objs_cbd:
        if o.type == 'MESH':
            o.scale *= scale_ratio
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_cbd if o.type == 'MESH'])
    offset = Vector((-0.78, 0.35, 0.14)) - c
    for o in objs_cbd:
        if o.type == 'MESH':
            o.location += offset
            all_meshes.append(o)
    print("✓ 真实胆总管网格装配完成")

    # 7. 空肠下行肠袢 (单根顺畅肠袢穿至胃大弯下方)
    mat_jejunum = create_pbr_mat("Jejunum_Orange", "#F4A460", alpha=0.88, roughness=0.32)
    pts_jejunum = [
        Vector((0.25, -0.45, 0.18)),
        Vector((0.68, -0.42, 0.25)),
        Vector((0.98, -0.65, 0.24)),
        Vector((0.92, -1.05, 0.18)),
        Vector((0.68, -1.35, 0.15))
    ]
    all_meshes.append(create_curve_tube("Jejunum_Loop", pts_jejunum, 0.13, mat_jejunum, organ_col))

    # =========================================================================
    # 4 大 3D 实体手术支架
    # =========================================================================
    # 1. 🔴 EUS-HGS (红宝石色拱形引流管)
    mat_stent_hgs = create_pbr_mat("Stent_EUS_HGS", "#FF2A2A", alpha=0.98, roughness=0.15, emission_hex="#FF2A2A", emission_strength=1.2)
    pts_hgs = [
        Vector((0.48, 0.85, 0.20)),
        Vector((0.15, 1.28, 0.25)),
        Vector((-0.35, 1.20, 0.20)),
        Vector((-0.75, 0.98, 0.14))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_HGS", pts_hgs, 0.038, mat_stent_hgs, stent_col))

    # 2. 🟠 EUS-CDS (亮橙色短吻合管)
    mat_stent_cds = create_pbr_mat("Stent_EUS_CDS", "#FF8C00", alpha=0.98, roughness=0.2, metallic=0.85, emission_hex="#FF8C00", emission_strength=0.8)
    pts_cds = [
        Vector((-0.35, 0.12, 0.18)),
        Vector((-0.55, 0.22, 0.16)),
        Vector((-0.75, 0.32, 0.14))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_CDS", pts_cds, 0.048, mat_stent_cds, stent_col))

    # 3. 🟣 EUS-PD (紫红色胰管引流管)
    mat_stent_pd = create_pbr_mat("Stent_EUS_PD", "#C2185B", alpha=0.98, roughness=0.2, emission_hex="#C2185B", emission_strength=0.9)
    pts_pd = [
        Vector((0.55, 0.18, 0.12)),
        Vector((0.25, 0.08, 0.06)),
        Vector((-0.10, -0.08, 0.04))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_PD", pts_pd, 0.034, mat_stent_pd, stent_col))

    # 4. 🟡 EUS-GE (金黄色双蘑菇头金属支架)
    mat_stent_ge = create_pbr_mat("Stent_EUS_GE", "#FFD700", alpha=0.98, roughness=0.25, metallic=0.95, emission_hex="#FFD700", emission_strength=0.6)
    pts_ge_waist = [
        Vector((0.68, -0.12, 0.28)),
        Vector((0.68, -0.27, 0.27)),
        Vector((0.68, -0.42, 0.25))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_GE_Waist", pts_ge_waist, 0.072, mat_stent_ge, stent_col))

    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.038, location=(0.68, -0.12, 0.28), rotation=(0.25, 0.15, 0))
    f_stomach = bpy.context.active_object
    f_stomach.name = "Stent_EUS_GE_FlangeStomach"
    f_stomach.data.materials.append(mat_stent_ge)
    move_to_col(f_stomach, stent_col)
    all_meshes.append(f_stomach)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.038, location=(0.68, -0.42, 0.25), rotation=(0.25, 0.15, 0))
    f_jejunum = bpy.context.active_object
    f_jejunum.name = "Stent_EUS_GE_FlangeJejunum"
    f_jejunum.data.materials.append(mat_stent_ge)
    move_to_col(f_jejunum, stent_col)
    all_meshes.append(f_jejunum)

    # 导出 GLB
    os.makedirs(EXPORT_DIR, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in all_meshes: obj.select_set(True)

    print(f"正在导出包含全部真实网格的单一 GLB 模型: {EXPORT_GLB_PATH} ...")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_PATH,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True
    )
    print(f"🎉 成功导出！模型大小: {os.path.getsize(EXPORT_GLB_PATH)/(1024*1024):.2f} MB")

if __name__ == "__main__":
    run()
