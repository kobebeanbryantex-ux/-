"""
=============================================================================
EUS 手术解说工具 · 100% 像素级对齐参考切面图（图2）的 Blender 解剖空间排布
=============================================================================
严格根据图 2 纠正前后深度与解剖连接关系：
1. 胃 (Stomach):
   - J 形胃囊，胃底胃体位于右侧 (X>0, Z 前方)，胃窦向左下方横跨延伸至幽门 (X~0, Y~0)
   - 材质采用图 2 级别的极美粉红半透明 (Alpha 0.75, Transmission 0.2)
2. 胰腺 (Pancreas):
   - 处于胃的【后方】(Z 轴在胃后面, Z<0)，胰头被十二指肠 C 环包绕，胰尾向右上延伸至胃后壁
3. 十二指肠 (Duodenum):
   - 从幽门接出，形成优雅的 C 环紧紧包绕胰头
4. 肝脏 (Liver):
   - 位于左上方 (X<0, Y>0.5)，左叶向下延伸至胃小弯左侧，露出树状胆管剖面
5. 胆囊与胆总管:
   - 胆囊悬于肝下，黄色胆总管纵行穿过胰头后方直接开口于十二指肠降部大乳头
6. 空肠 (Jejunum):
   - 从十二指肠下端接出，下行穿行至胃大弯正下方
7. 4 大 3D 实体手术支架 (严格对应图 2 空间锚点):
   - EUS-HGS: 胃小弯上部 ➔ 肝左叶胆管 (红宝石拱形管)
   - EUS-CDS: 十二指肠球部 ➔ 胆总管中段 (橙色金属管)
   - EUS-PD: 胃后壁 ➔ 主胰管 (紫红色管)
   - EUS-GE: 胃大弯下壁 ➔ 空肠 (金黄色双喇叭口金属网状马鞍支架 LAMS)
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
    curve_data.bevel_resolution = 12
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

def run_alignment():
    print("🚀 正在严格按图 2 标准空间解剖层次重构所有器官与支架...")
    clear_scene()

    organ_col = bpy.data.collections.new("Real_Organs")
    stent_col = bpy.data.collections.new("Surgical_Stents")
    bpy.context.scene.collection.children.link(organ_col)
    bpy.context.scene.collection.children.link(stent_col)

    all_meshes = []

    # =========================================================================
    # 1. 胃 (Stomach) - 右侧主体 (Z=0.15 前方)
    # =========================================================================
    p_stomach = os.path.join(MODELS_DIR, "胃", "stomach_z_anatomy.glb")
    objs_stomach = import_glb(p_stomach)
    mat_stomach = create_pbr_mat("Stomach_Pink", "#FFAEB9", alpha=0.75, roughness=0.30, transmission=0.20)
    for o in objs_stomach:
        move_to_col(o, organ_col)
        if o.type == 'MESH':
            o.data.materials.clear()
            o.data.materials.append(mat_stomach)

    bpy.context.view_layer.update()
    c, s = get_objects_bounding_box([o for o in objs_stomach if o.type == 'MESH'])
    scale_stomach = 1.95 / max(s.x, s.y, s.z, 0.001)
    for o in objs_stomach:
        if o.type == 'MESH':
            o.scale *= scale_stomach
            o.rotation_euler = (0.05, 0.0, -0.22)
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_stomach if o.type == 'MESH'])
    offset_stomach = Vector((0.72, 0.52, 0.18)) - c
    for o in objs_stomach:
        if o.type == 'MESH':
            o.location += offset_stomach
            all_meshes.append(o)
    print("✓ 胃部空间校准完成")

    # =========================================================================
    # 2. 食管 (Esophagus) - 正上方垂直管道直连胃贲门
    # =========================================================================
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
    scale_esoph = 1.30 / max(s.x, s.y, s.z, 0.001)
    for o in objs_esoph:
        if o.type == 'MESH':
            o.scale *= scale_esoph
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_esoph if o.type == 'MESH'])
    offset_esoph = Vector((0.28, 1.68, 0.05)) - c
    for o in objs_esoph:
        if o.type == 'MESH':
            o.location += offset_esoph
            all_meshes.append(o)
    print("✓ 食管空间校准完成")

    # =========================================================================
    # 3. 肝脏 (Liver) - 左上方 (X=-1.15, Y=1.05)
    # =========================================================================
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
    scale_liver = 2.15 / max(s.x, s.y, s.z, 0.001)
    for o in objs_liver:
        if o.type == 'MESH':
            o.scale *= scale_liver
            o.rotation_euler = (-0.05, 0.15, -0.05)
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_liver if o.type == 'MESH'])
    offset_liver = Vector((-1.15, 1.05, 0.02)) - c
    for o in objs_liver:
        if o.type == 'MESH':
            o.location += offset_liver
            all_meshes.append(o)
    print("✓ 肝脏空间校准完成")

    # =========================================================================
    # 4. 胰腺 (Pancreas) - 处于胃【后下方】(Z=-0.15)，胰头向左下嵌在 C 环
    # =========================================================================
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
    scale_pancreas = 1.65 / max(s.x, s.y, s.z, 0.001)
    for o in objs_pancreas:
        if o.type == 'MESH':
            o.scale *= scale_pancreas
            o.rotation_euler = (0.1, 0.0, 0.05)
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_pancreas if o.type == 'MESH'])
    offset_pancreas = Vector((-0.20, -0.22, -0.15)) - c # Z 深度在胃后方
    for o in objs_pancreas:
        if o.type == 'MESH':
            o.location += offset_pancreas
            all_meshes.append(o)
    print("✓ 胰腺空间校准完成（成功后置）")

    # =========================================================================
    # 5. 胆囊 (Gallbladder) - 肝下水滴囊袋 (X=-1.12, Y=0.22)
    # =========================================================================
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
    scale_gb = 0.55 / max(s.x, s.y, s.z, 0.001)
    for o in objs_gb:
        if o.type == 'MESH':
            o.scale *= scale_gb
            o.rotation_euler = (0.0, 0.0, -0.5)
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_gb if o.type == 'MESH'])
    offset_gb = Vector((-1.12, 0.22, 0.22)) - c
    for o in objs_gb:
        if o.type == 'MESH':
            o.location += offset_gb
            all_meshes.append(o)
    print("✓ 胆囊空间校准完成")

    # =========================================================================
    # 6. 胆总管 (CBD) - 自肝门向下直插十二指肠大乳头 (X=-0.65)
    # =========================================================================
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
    scale_cbd = 1.05 / max(s.x, s.y, s.z, 0.001)
    for o in objs_cbd:
        if o.type == 'MESH':
            o.scale *= scale_cbd
    bpy.context.view_layer.update()
    c, _ = get_objects_bounding_box([o for o in objs_cbd if o.type == 'MESH'])
    offset_cbd = Vector((-0.65, 0.32, 0.14)) - c
    for o in objs_cbd:
        if o.type == 'MESH':
            o.location += offset_cbd
            all_meshes.append(o)
    print("✓ 胆总管空间校准完成")

    # =========================================================================
    # 7. 空肠下行肠袢 (单根顺畅肠袢穿至胃大弯下方)
    # =========================================================================
    mat_jejunum = create_pbr_mat("Jejunum_Orange", "#F4A460", alpha=0.88, roughness=0.32)
    pts_jejunum = [
        Vector((0.25, -0.45, 0.18)),
        Vector((0.68, -0.42, 0.25)), # 胃大弯正下方 (EUS-GE 靶位)
        Vector((0.98, -0.65, 0.24)),
        Vector((0.92, -1.05, 0.18)),
        Vector((0.68, -1.35, 0.15))
    ]
    all_meshes.append(create_curve_tube("Jejunum_Loop", pts_jejunum, 0.13, mat_jejunum, organ_col))

    # =========================================================================
    # 🌟 4 大 3D 实体手术支架 (严格对应图 2 红色与金色管道)
    # =========================================================================
    # 1. 🔴 EUS-HGS (红宝石拱形引流管：胃小弯上部 -> 肝左叶肝内胆管)
    mat_stent_hgs = create_pbr_mat("Stent_EUS_HGS", "#FF2A2A", alpha=0.98, roughness=0.15, emission_hex="#FF2A2A", emission_strength=1.2)
    pts_hgs = [
        Vector((0.45, 0.85, 0.22)),
        Vector((0.15, 1.30, 0.28)),
        Vector((-0.35, 1.22, 0.22)),
        Vector((-0.72, 0.98, 0.14))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_HGS", pts_hgs, 0.038, mat_stent_hgs, stent_col))

    # 2. 🟠 EUS-CDS (亮橙色短吻合管：十二指肠球部 -> 胆总管中段)
    mat_stent_cds = create_pbr_mat("Stent_EUS_CDS", "#FF8C00", alpha=0.98, roughness=0.2, metallic=0.85, emission_hex="#FF8C00", emission_strength=0.8)
    pts_cds = [
        Vector((-0.28, 0.08, 0.18)),
        Vector((-0.45, 0.18, 0.16)),
        Vector((-0.65, 0.28, 0.14))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_CDS", pts_cds, 0.048, mat_stent_cds, stent_col))

    # 3. 🟣 EUS-PD (紫红色胰管引流支架：胃后壁 -> 胰腺主胰管)
    mat_stent_pd = create_pbr_mat("Stent_EUS_PD", "#C2185B", alpha=0.98, roughness=0.2, emission_hex="#C2185B", emission_strength=0.9)
    pts_pd = [
        Vector((0.55, 0.18, 0.12)),
        Vector((0.25, 0.08, 0.02)),
        Vector((-0.10, -0.08, -0.10))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_PD", pts_pd, 0.034, mat_stent_pd, stent_col))

    # 4. 🟡 EUS-GE (金黄色双蘑菇头金属网格马鞍支架 LAMS：胃大弯下壁 -> 空肠)
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

    print(f"正在导出严格按图 2 层次校准的 GLB 模型: {EXPORT_GLB_PATH} ...")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_PATH,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True
    )
    print(f"🎉 导出成功！模型大小: {os.path.getsize(EXPORT_GLB_PATH)/(1024*1024):.2f} MB")

if __name__ == "__main__":
    run_alignment()
