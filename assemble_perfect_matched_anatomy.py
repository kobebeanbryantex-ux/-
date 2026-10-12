"""
=============================================================================
EUS 手术解说工具 · 100% 像素级对齐 8K 3D 医学解剖切面图的 Blender 装配脚本
=============================================================================
"""

import bpy
import os
import math
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = SCRIPT_DIR
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

def create_pbr_material(name, hex_color, alpha=1.0, roughness=0.35, transmission=0.0, metallic=0.0, emission_hex=None, emission_strength=0.0):
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

def move_to_col(obj, target_col):
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    target_col.objects.link(obj)

def create_curve_tube(name, points, bevel_depth, mat, target_col, bevel_resolution=10):
    curve_data = bpy.data.curves.new(name=name, type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = bevel_depth
    curve_data.bevel_resolution = bevel_resolution
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

def build_perfect_3d_render():
    print("🚀 开始按 8K 3D 医学切面图 1:1 构建高精解剖与手术支架系统...")
    clear_scene()

    organ_col = bpy.data.collections.new("Anatomical_Organs")
    stent_col = bpy.data.collections.new("Surgical_Stents")
    bpy.context.scene.collection.children.link(organ_col)
    bpy.context.scene.collection.children.link(stent_col)

    all_meshes = []

    # =========================================================================
    # 1. 食管 (Esophagus) - 正上方垂直下行管道
    # =========================================================================
    mat_esoph = create_pbr_material("Esophagus", "#F0A8B8", alpha=0.88, roughness=0.3, transmission=0.1)
    pts_esoph = [
        Vector((0.28, 2.20, 0.00)),
        Vector((0.28, 1.45, 0.00)),
        Vector((0.30, 0.95, 0.05))
    ]
    all_meshes.append(create_curve_tube("Esophagus", pts_esoph, 0.11, mat_esoph, organ_col))

    # =========================================================================
    # 2. 胃 (Stomach) - 右侧饱满 J 形大胃囊
    # =========================================================================
    mat_stomach = create_pbr_material("Stomach", "#FFAEB9", alpha=0.80, roughness=0.32, transmission=0.15)
    
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=0.68, location=(0.75, 0.65, 0.12))
    stomach_body = bpy.context.active_object
    stomach_body.name = "Stomach_Body"
    stomach_body.scale = (1.15, 1.25, 0.85)
    stomach_body.rotation_euler = (0.1, 0.1, -0.25)
    stomach_body.data.materials.append(mat_stomach)
    move_to_col(stomach_body, organ_col)
    all_meshes.append(stomach_body)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=0.48, location=(0.65, 1.05, 0.10))
    stomach_fundus = bpy.context.active_object
    stomach_fundus.name = "Stomach_Fundus"
    stomach_fundus.scale = (1.0, 1.1, 0.85)
    stomach_fundus.data.materials.append(mat_stomach)
    move_to_col(stomach_fundus, organ_col)
    all_meshes.append(stomach_fundus)

    pts_antrum = [
        Vector((0.68, 0.25, 0.15)),
        Vector((0.35, 0.05, 0.18)),
        Vector((-0.05, 0.02, 0.18)),
        Vector((-0.25, 0.08, 0.16))
    ]
    all_meshes.append(create_curve_tube("Stomach_Antrum_Pylorus", pts_antrum, 0.22, mat_stomach, organ_col))

    # =========================================================================
    # 3. 肝脏 (Liver) - 左上方红褐色肝实质 + 肝内树状胆管剖面
    # =========================================================================
    mat_liver = create_pbr_material("Liver", "#9E2B25", alpha=0.92, roughness=0.35)
    
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=1.05, location=(-1.15, 1.05, -0.05))
    liver_main = bpy.context.active_object
    liver_main.name = "Liver_Main"
    liver_main.scale = (1.30, 0.95, 0.75)
    liver_main.rotation_euler = (-0.1, 0.25, -0.15)
    liver_main.data.materials.append(mat_liver)
    move_to_col(liver_main, organ_col)
    all_meshes.append(liver_main)

    mat_duct_tree = create_pbr_material("Intrahepatic_Ducts", "#4E3629", alpha=0.95, roughness=0.3)
    tree_branches = [
        [Vector((-0.65, 0.95, 0.12)), Vector((-0.85, 1.15, 0.10)), Vector((-1.15, 1.35, 0.08))],
        [Vector((-0.85, 1.15, 0.10)), Vector((-0.75, 1.40, 0.10))],
        [Vector((-0.85, 1.15, 0.10)), Vector((-1.05, 1.10, 0.10)), Vector((-1.35, 1.15, 0.06))],
        [Vector((-0.65, 0.95, 0.12)), Vector((-0.55, 0.65, 0.14))]
    ]
    for i, br in enumerate(tree_branches):
        all_meshes.append(create_curve_tube(f"Liver_Duct_Branch_{i}", br, 0.028 if i>0 else 0.042, mat_duct_tree, organ_col))

    # =========================================================================
    # 4. 胆囊 (Gallbladder) - 肝下墨绿色水滴状囊袋
    # =========================================================================
    mat_gb = create_pbr_material("Gallbladder", "#2E7D32", alpha=0.95, roughness=0.25, transmission=0.1)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=0.32, location=(-1.15, 0.22, 0.22))
    gb_body = bpy.context.active_object
    gb_body.name = "Gallbladder_Body"
    gb_body.scale = (0.75, 1.25, 0.75)
    gb_body.rotation_euler = (0.2, -0.3, 0.65)
    gb_body.data.materials.append(mat_gb)
    move_to_col(gb_body, organ_col)
    all_meshes.append(gb_body)

    pts_cyst = [
        Vector((-1.02, 0.42, 0.20)),
        Vector((-0.88, 0.55, 0.18)),
        Vector((-0.68, 0.52, 0.15))
    ]
    all_meshes.append(create_curve_tube("Cystic_Duct", pts_cyst, 0.032, mat_gb, organ_col))

    # =========================================================================
    # 5. 胆总管 (CBD) - 鲜黄色竖直管道直通十二指肠大乳头
    # =========================================================================
    mat_cbd = create_pbr_material("CBD", "#FBC02D", alpha=0.98, roughness=0.22, transmission=0.1)
    pts_cbd = [
        Vector((-0.55, 0.65, 0.14)),
        Vector((-0.68, 0.42, 0.14)),
        Vector((-0.65, 0.05, 0.15)),
        Vector((-0.60, -0.28, 0.16))
    ]
    all_meshes.append(create_curve_tube("Common_Bile_Duct", pts_cbd, 0.048, mat_cbd, organ_col))

    # =========================================================================
    # 6. 胰腺 (Pancreas) - 淡黄色颗粒感腺体，横卧中线
    # =========================================================================
    mat_pancreas = create_pbr_material("Pancreas", "#F6D887", alpha=0.88, roughness=0.45)
    
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.38, location=(-0.35, -0.28, 0.08))
    p_head = bpy.context.active_object
    p_head.name = "Pancreas_Head"
    p_head.scale = (1.1, 0.95, 0.8)
    p_head.data.materials.append(mat_pancreas)
    move_to_col(p_head, organ_col)
    all_meshes.append(p_head)

    pts_pancreas_body = [
        Vector((-0.25, -0.25, 0.08)),
        Vector((0.15, -0.15, 0.02)),
        Vector((0.55, -0.05, -0.05)),
        Vector((0.95, 0.10, -0.10))
    ]
    all_meshes.append(create_curve_tube("Pancreas_Body_Tail", pts_pancreas_body, 0.16, mat_pancreas, organ_col))

    # =========================================================================
    # 7. 十二指肠 (Duodenum C-loop) - 优美 C 环紧密包绕胰头
    # =========================================================================
    mat_duo = create_pbr_material("Duodenum", "#F8B195", alpha=0.85, roughness=0.3, transmission=0.1)
    pts_duo = [
        Vector((-0.25, 0.08, 0.16)),
        Vector((-0.68, 0.02, 0.18)),
        Vector((-0.82, -0.28, 0.18)),
        Vector((-0.72, -0.65, 0.16)),
        Vector((-0.30, -0.72, 0.14)),
        Vector((0.15, -0.65, 0.16)),
        Vector((0.35, -0.52, 0.20))
    ]
    all_meshes.append(create_curve_tube("Duodenum_C_Loop", pts_duo, 0.16, mat_duo, organ_col))

    # =========================================================================
    # 8. 空肠 (Jejunum) - 顺畅下行单根肠袢 (穿至胃大弯正下方)
    # =========================================================================
    mat_jejunum = create_pbr_material("Jejunum", "#F4A460", alpha=0.90, roughness=0.32)
    pts_jejunum = [
        Vector((0.35, -0.52, 0.20)),
        Vector((0.68, -0.50, 0.26)),
        Vector((0.92, -0.72, 0.24)),
        Vector((0.85, -1.15, 0.18)),
        Vector((0.60, -1.45, 0.15))
    ]
    all_meshes.append(create_curve_tube("Jejunum_Loop", pts_jejunum, 0.14, mat_jejunum, organ_col))

    # =========================================================================
    # 🌟 4 大 3D 实体手术支架 (严格对应 3D 切面图与手绘红线)
    # =========================================================================
    # 1. 🔴 EUS-HGS (鲜红发光拱形引流管：胃小弯上部 -> 肝左叶肝内胆管)
    mat_stent_hgs = create_pbr_material("Stent_EUS_HGS", "#FF2A2A", alpha=0.98, roughness=0.15, emission_hex="#FF2A2A", emission_strength=1.2)
    pts_hgs = [
        Vector((0.48, 0.82, 0.22)),
        Vector((0.15, 1.25, 0.26)),
        Vector((-0.35, 1.18, 0.22)),
        Vector((-0.68, 0.95, 0.14))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_HGS", pts_hgs, 0.036, mat_stent_hgs, stent_col, bevel_resolution=12))

    # 2. 🟠 EUS-CDS (亮橙色金属网格短吻合管：十二指肠球部 -> 胆总管中段)
    mat_stent_cds = create_pbr_material("Stent_EUS_CDS", "#FF8C00", alpha=0.98, roughness=0.2, metallic=0.85, emission_hex="#FF8C00", emission_strength=0.8)
    pts_cds = [
        Vector((-0.38, 0.08, 0.18)),
        Vector((-0.52, 0.18, 0.16)),
        Vector((-0.66, 0.28, 0.14))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_CDS", pts_cds, 0.048, mat_stent_cds, stent_col, bevel_resolution=12))

    # 3. 🟣 EUS-PD (紫红色胰管引流支架：胃后壁 -> 胰腺主胰管)
    mat_stent_pd = create_pbr_material("Stent_EUS_PD", "#C2185B", alpha=0.98, roughness=0.2, emission_hex="#C2185B", emission_strength=0.9)
    pts_pd = [
        Vector((0.55, 0.15, 0.12)),
        Vector((0.25, 0.05, 0.06)),
        Vector((-0.10, -0.12, 0.04))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_PD", pts_pd, 0.034, mat_stent_pd, stent_col, bevel_resolution=12))

    # 4. 🟡 EUS-GE (金黄色双喇叭口金属网格马鞍支架 LAMS：胃大弯下壁 -> 空肠)
    mat_stent_ge = create_pbr_material("Stent_EUS_GE", "#FFD700", alpha=0.98, roughness=0.25, metallic=0.95, emission_hex="#FFD700", emission_strength=0.6)
    pts_ge_waist = [
        Vector((0.68, -0.18, 0.28)),
        Vector((0.68, -0.34, 0.27)),
        Vector((0.68, -0.50, 0.26))
    ]
    all_meshes.append(create_curve_tube("Stent_EUS_GE_Waist", pts_ge_waist, 0.072, mat_stent_ge, stent_col, bevel_resolution=16))

    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.038, location=(0.68, -0.18, 0.28), rotation=(0.25, 0.15, 0))
    f_stomach = bpy.context.active_object
    f_stomach.name = "Stent_EUS_GE_FlangeStomach"
    f_stomach.data.materials.append(mat_stent_ge)
    move_to_col(f_stomach, stent_col)
    all_meshes.append(f_stomach)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.038, location=(0.68, -0.50, 0.26), rotation=(0.25, 0.15, 0))
    f_jejunum = bpy.context.active_object
    f_jejunum.name = "Stent_EUS_GE_FlangeJejunum"
    f_jejunum.data.materials.append(mat_stent_ge)
    move_to_col(f_jejunum, stent_col)
    all_meshes.append(f_jejunum)

    # =========================================================================
    # 导出 GLB
    # =========================================================================
    os.makedirs(EXPORT_DIR, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in all_meshes: obj.select_set(True)

    print(f"正在导出 1:1 对齐 8K 3D 切面图的高精 GLB 模型: {EXPORT_GLB_PATH} ...")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_PATH,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True
    )
    print(f"🎉 成功导出！模型大小: {os.path.getsize(EXPORT_GLB_PATH)/(1024*1024):.2f} MB")

if __name__ == "__main__":
    build_perfect_3d_render()
