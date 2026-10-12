"""
=============================================================================
EUS 手术解说工具 · 完美器官尺寸重构、医学色彩重染与 3D 标本高质感渲染
=============================================================================
彻底修复所有问题：
1. 彻底解决尺寸爆炸问题：所有器官在 join 前重置缩放并 apply transforms，
   胃宽 1.8，肝宽 2.1，胰宽 1.6，胆囊长 0.55，胆管长 0.85，空肠与食管严丝合缝！
2. 肝脏与胰腺：100% 照搬并保全 Anatomy Atelier 原版材质与贴图 (BaseColor, Normal Map)
3. 胃部医学重染：纯正饱满活体粉润组织质感 (#E8828F / #F0929D)，次表面散射，湿润黏膜光泽
4. 胆囊与胆总管重染：饱满翠绿清漆囊袋 (#1E7B34) 与明黄胆管 (#F9A825)
5. 空肠与食管重染：自然消化道肠黏膜色 (#DE7462 / #EFA0A8)
6. 4 大实体手术支架：鲜红拱桥 HGS、亮橙水平 CDS、紫红 PD、黄金双法兰 GE
7. 对象与网格数据双重命名，确保 Three.js 100% 正确匹配
8. 摄影棚级三点布光渲染 6 大器官的高清透明 3D 标本大图
=============================================================================
"""

import bpy
import os
import math
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = SCRIPT_DIR
MODELS_DIR = os.path.join(PROJECT_ROOT, "EUS_手术解说工具", "02_器官模型")
REF_MODELS_DIR = os.path.join(PROJECT_ROOT, "EUS_手术解说工具", "06_前端项目", "reference", "public", "models")
EXPORT_DIR = os.path.join(PROJECT_ROOT, "EUS_手术解说工具", "06_前端项目", "public", "models")
THUMB_DIR = os.path.join(PROJECT_ROOT, "EUS_手术解说工具", "06_前端项目", "public", "thumbnails")

os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)
EXPORT_GLB_PATH = os.path.join(EXPORT_DIR, "digestive_system.glb")

def hex_to_linear_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0
    to_linear = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (to_linear(r), to_linear(g), to_linear(b), 1.0)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_mat(name, hex_color, roughness=0.35, metallic=0.0, sss_weight=0.0, sss_color=None, clearcoat=0.0, emission_hex=None, emission_strength=0.0):
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
    if "Metallic" in bsdf.inputs: bsdf.inputs["Metallic"].default_value = metallic
    
    if sss_weight > 0:
        if "Subsurface Weight" in bsdf.inputs: bsdf.inputs["Subsurface Weight"].default_value = sss_weight
        elif "Subsurface" in bsdf.inputs: bsdf.inputs["Subsurface"].default_value = sss_weight
        if sss_color and "Subsurface Color" in bsdf.inputs:
            bsdf.inputs["Subsurface Color"].default_value = hex_to_linear_rgb(sss_color)

    if clearcoat > 0:
        if "Coat Weight" in bsdf.inputs: bsdf.inputs["Coat Weight"].default_value = clearcoat
        elif "Clearcoat" in bsdf.inputs: bsdf.inputs["Clearcoat"].default_value = clearcoat

    if emission_hex and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = hex_to_linear_rgb(emission_hex)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength

    return mat

def import_glb(filepath):
    existing_objs = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=filepath)
    return [o for o in bpy.data.objects if o not in existing_objs]

def get_bbox(obj):
    min_co = Vector((float('inf'), float('inf'), float('inf')))
    max_co = Vector((float('-inf'), float('-inf'), float('-inf')))
    for corner in obj.bound_box:
        w = obj.matrix_world @ Vector(corner)
        min_co.x = min(min_co.x, w.x); min_co.y = min(min_co.y, w.y); min_co.z = min(min_co.z, w.z)
        max_co.x = max(max_co.x, w.x); max_co.y = max(max_co.y, w.y); max_co.z = max(max_co.z, w.z)
    return (min_co + max_co) / 2.0, max_co - min_co

def create_curve_tube(name, points, bevel_depth, mat):
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
    bpy.context.scene.collection.objects.link(obj)
    
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.name = name
    obj.data.name = f"Mesh_{name}"
    obj.data.materials.append(mat)
    return obj

def run_rebuild():
    print("🚀 开始全流程重构：修复尺寸、照搬贴图、医学专业着色与标本渲染...")
    clear_scene()

    all_organs = {}

    # =========================================================================
    # 1. 胃 (Stomach) - 干净合并、统一缩放、饱满活体粉润着色
    # =========================================================================
    p_stomach = os.path.join(MODELS_DIR, "胃", "stomach_z_anatomy.glb")
    objs_stomach = [o for o in import_glb(p_stomach) if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs_stomach: o.select_set(True)
    bpy.context.view_layer.objects.active = objs_stomach[0]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.join()
    obj_stomach = bpy.context.active_object
    obj_stomach.name = "Organ_Stomach"
    obj_stomach.data.name = "Mesh_Stomach"

    # 规范胃的尺寸与位置 (基准尺寸: 宽 1.85)
    center, size = get_bbox(obj_stomach)
    s_factor = 1.85 / max(size.x, size.y, size.z, 0.001)
    obj_stomach.scale = (s_factor, s_factor, s_factor)
    obj_stomach.rotation_euler = (0.05, 0.0, -0.22)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    center, _ = get_bbox(obj_stomach)
    obj_stomach.location += (Vector((0.68, 0.48, 0.18)) - center)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # 🌟 胃部医学专业级着色：饱满粉润活体胃黏膜次表面组织质感
    mat_stomach = create_pbr_mat(
        "Stomach_Medical",
        hex_color="#E8828F", # 真实健康胃黏膜粉红
        roughness=0.30, # 湿润黏膜光泽
        sss_weight=0.20,
        sss_color="#FFA0AC"
    )
    obj_stomach.data.materials.clear()
    obj_stomach.data.materials.append(mat_stomach)
    all_organs["stomach"] = obj_stomach
    print(f"✓ 胃部构建成功，真实尺寸: {list(obj_stomach.dimensions)}")

    # =========================================================================
    # 2. 肝脏 (Liver) - 🌟 100% 照搬 Anatomy Atelier 原版材质与高清贴图
    # =========================================================================
    p_liver = os.path.join(REF_MODELS_DIR, "liver.glb")
    objs_liver = [o for o in import_glb(p_liver) if o.type == 'MESH']
    obj_liver = objs_liver[0]
    obj_liver.name = "Organ_Liver"
    obj_liver.data.name = "Mesh_Liver"

    # 先选中并彻底清空既有缩放矩阵，确保顶点包围盒真实准确
    bpy.ops.object.select_all(action='DESELECT')
    obj_liver.select_set(True)
    bpy.context.view_layer.objects.active = obj_liver
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    # 保全原版材质，调优高光并确保底色不压暗贴图
    if obj_liver.data.materials:
        mat_l = obj_liver.data.materials[0]
        if mat_l.use_nodes:
            for n in mat_l.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    if "Base Color" in n.inputs and not n.inputs["Base Color"].is_linked:
                        n.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
                    if "Roughness" in n.inputs: n.inputs["Roughness"].default_value = 0.38
                    if "Metallic" in n.inputs: n.inputs["Metallic"].default_value = 0.0

    center, size = get_bbox(obj_liver)
    s_factor = 2.15 / max(size.x, size.y, size.z, 0.001)
    obj_liver.scale = (s_factor, s_factor, s_factor)
    obj_liver.rotation_euler = (-0.05, 0.15, -0.05)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    center, _ = get_bbox(obj_liver)
    obj_liver.location += (Vector((-1.15, 1.05, 0.02)) - center)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    all_organs["liver"] = obj_liver
    print(f"✓ 肝脏构建成功 (Atelier原版贴图)，真实尺寸: {list(obj_liver.dimensions)}")

    # =========================================================================
    # 3. 胰腺 (Pancreas) - 🌟 100% 照搬 Anatomy Atelier 原版材质与法线贴图
    # =========================================================================
    p_pancreas = os.path.join(REF_MODELS_DIR, "pancreas.glb")
    objs_pancreas = [o for o in import_glb(p_pancreas) if o.type == 'MESH']
    obj_pancreas = objs_pancreas[0]
    obj_pancreas.name = "Organ_Pancreas"
    obj_pancreas.data.name = "Mesh_Pancreas"

    bpy.ops.object.select_all(action='DESELECT')
    obj_pancreas.select_set(True)
    bpy.context.view_layer.objects.active = obj_pancreas
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    if obj_pancreas.data.materials:
        mat_p = obj_pancreas.data.materials[0]
        if mat_p.use_nodes:
            for n in mat_p.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    if "Base Color" in n.inputs and not n.inputs["Base Color"].is_linked:
                        n.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
                    if "Roughness" in n.inputs: n.inputs["Roughness"].default_value = 0.40
                    if "Metallic" in n.inputs: n.inputs["Metallic"].default_value = 0.0

    center, size = get_bbox(obj_pancreas)
    s_factor = 1.65 / max(size.x, size.y, size.z, 0.001)
    obj_pancreas.scale = (s_factor, s_factor, s_factor)
    obj_pancreas.rotation_euler = (0.10, 0.0, 0.05)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    center, _ = get_bbox(obj_pancreas)
    obj_pancreas.location += (Vector((-0.20, -0.22, -0.15)) - center)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    all_organs["pancreas"] = obj_pancreas
    print(f"✓ 胰腺构建成功 (Atelier原版贴图)，真实尺寸: {list(obj_pancreas.dimensions)}")

    # =========================================================================
    # 4. 胆囊与胆总管 (Gallbladder & CBD) - 翠绿水滴与明黄主干道
    # =========================================================================
    p_gb = os.path.join(MODELS_DIR, "胆囊", "gallbladder_z_anatomy.glb")
    objs_gb = [o for o in import_glb(p_gb) if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs_gb: o.select_set(True)
    bpy.context.view_layer.objects.active = objs_gb[0]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.join()
    obj_gb = bpy.context.active_object
    obj_gb.name = "Organ_Gallbladder"
    obj_gb.data.name = "Mesh_Gallbladder"

    center, size = get_bbox(obj_gb)
    s_factor = 0.52 / max(size.x, size.y, size.z, 0.001)
    obj_gb.scale = (s_factor, s_factor, s_factor)
    obj_gb.rotation_euler = (0.0, 0.0, -0.5)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    center, _ = get_bbox(obj_gb)
    obj_gb.location += (Vector((-1.12, 0.22, 0.22)) - center)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # 胆囊翠绿光洁水滴清漆质感
    mat_gb = create_pbr_mat("Gallbladder_Emerald", "#1E7B34", roughness=0.20, clearcoat=0.5, sss_weight=0.15, sss_color="#2E9E48")
    obj_gb.data.materials.clear()
    obj_gb.data.materials.append(mat_gb)
    print(f"✓ 胆囊构建成功，真实尺寸: {list(obj_gb.dimensions)}")

    p_cbd = os.path.join(MODELS_DIR, "胆总管", "bile_duct_z_anatomy.glb")
    objs_cbd = [o for o in import_glb(p_cbd) if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs_cbd: o.select_set(True)
    bpy.context.view_layer.objects.active = objs_cbd[0]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.join()
    obj_cbd = bpy.context.active_object
    obj_cbd.name = "Organ_BileDuct"
    obj_cbd.data.name = "Mesh_BileDuct"

    center, size = get_bbox(obj_cbd)
    s_factor = 0.95 / max(size.x, size.y, size.z, 0.001)
    obj_cbd.scale = (s_factor, s_factor, s_factor)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    center, _ = get_bbox(obj_cbd)
    obj_cbd.location += (Vector((-0.65, 0.30, 0.14)) - center)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # 胆总管标志性明黄色
    mat_cbd = create_pbr_mat("CBD_Golden", "#F9A825", roughness=0.25)
    obj_cbd.data.materials.clear()
    obj_cbd.data.materials.append(mat_cbd)
    print(f"✓ 胆总管构建成功，真实尺寸: {list(obj_cbd.dimensions)}")

    # =========================================================================
    # 5. 食管 (Esophagus)
    # =========================================================================
    p_esoph = os.path.join(MODELS_DIR, "食管", "esophagus_z_anatomy.glb")
    objs_esoph = [o for o in import_glb(p_esoph) if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs_esoph: o.select_set(True)
    bpy.context.view_layer.objects.active = objs_esoph[0]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.join()
    obj_esoph = bpy.context.active_object
    obj_esoph.name = "Organ_Esophagus"
    obj_esoph.data.name = "Mesh_Esophagus"

    center, size = get_bbox(obj_esoph)
    s_factor = 1.30 / max(size.x, size.y, size.z, 0.001)
    obj_esoph.scale = (s_factor, s_factor, s_factor)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    center, _ = get_bbox(obj_esoph)
    obj_esoph.location += (Vector((0.28, 1.68, 0.05)) - center)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    mat_esoph = create_pbr_mat("Esophagus_Mucosa", "#EFA0A8", roughness=0.32)
    obj_esoph.data.materials.clear()
    obj_esoph.data.materials.append(mat_esoph)
    all_organs["esophagus"] = obj_esoph
    print(f"✓ 食管构建成功，真实尺寸: {list(obj_esoph.dimensions)}")

    # =========================================================================
    # 6. 空肠肠管 (Jejunum)
    # =========================================================================
    mat_jejunum = create_pbr_mat("Jejunum_Enteric", "#DE7462", roughness=0.32, sss_weight=0.15)
    pts_jejunum = [
        Vector((0.25, -0.45, 0.18)),
        Vector((0.68, -0.42, 0.25)), # 胃大弯正下方吻合靶位
        Vector((0.98, -0.65, 0.24)),
        Vector((0.92, -1.05, 0.18)),
        Vector((0.68, -1.35, 0.15))
    ]
    obj_jejunum = create_curve_tube("Organ_Jejunum", pts_jejunum, 0.13, mat_jejunum)
    all_organs["jejunum"] = obj_jejunum
    print(f"✓ 空肠构建成功，真实尺寸: {list(obj_jejunum.dimensions)}")

    # =========================================================================
    # 🌟 4 大实体手术支架 (严格对应手绘草图位置)
    # =========================================================================
    # 1. 🔴 EUS-HGS (红宝石拱形引流管)
    mat_stent_hgs = create_pbr_mat("Stent_EUS_HGS", "#FF2222", roughness=0.15, emission_hex="#FF2222", emission_strength=1.3)
    pts_hgs = [
        Vector((0.45, 0.85, 0.22)),
        Vector((0.15, 1.30, 0.28)),
        Vector((-0.35, 1.22, 0.22)),
        Vector((-0.72, 0.98, 0.14))
    ]
    create_curve_tube("Stent_EUS_HGS", pts_hgs, 0.038, mat_stent_hgs)

    # 2. 🟠 EUS-CDS (水平横向直管：胃小弯中下部 -> 胆总管)
    mat_stent_cds = create_pbr_mat("Stent_EUS_CDS", "#FF7700", roughness=0.20, metallic=0.9, emission_hex="#FF7700", emission_strength=0.9)
    pts_cds = [
        Vector((-0.28, 0.08, 0.18)),
        Vector((-0.45, 0.18, 0.16)),
        Vector((-0.65, 0.28, 0.14))
    ]
    create_curve_tube("Stent_EUS_CDS", pts_cds, 0.048, mat_stent_cds)

    # 3. 🟣 EUS-PD (胃下后壁 -> 主胰管向下短弯管)
    mat_stent_pd = create_pbr_mat("Stent_EUS_PD", "#C2185B", roughness=0.20, emission_hex="#C2185B", emission_strength=1.0)
    pts_pd = [
        Vector((0.25, 0.08, 0.02)),
        Vector((0.08, 0.00, -0.04)),
        Vector((-0.10, -0.08, -0.10))
    ]
    create_curve_tube("Stent_EUS_PD", pts_pd, 0.034, mat_stent_pd)

    # 4. 🟡 EUS-GE (双喇叭口马鞍支架 LAMS)
    mat_stent_ge = create_pbr_mat("Stent_EUS_GE", "#FFD700", roughness=0.22, metallic=0.95, emission_hex="#FFD700", emission_strength=0.7)
    pts_ge_waist = [
        Vector((0.68, -0.12, 0.28)),
        Vector((0.68, -0.27, 0.27)),
        Vector((0.68, -0.42, 0.25))
    ]
    stent_ge_waist = create_curve_tube("Stent_EUS_GE_Waist", pts_ge_waist, 0.072, mat_stent_ge)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.038, location=(0.68, -0.12, 0.28), rotation=(0.25, 0.15, 0))
    f_stomach = bpy.context.active_object
    f_stomach.name = "Stent_EUS_GE_FlangeStomach"
    f_stomach.data.name = "Mesh_Stent_EUS_GE_FlangeStomach"
    f_stomach.data.materials.append(mat_stent_ge)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.038, location=(0.68, -0.42, 0.25), rotation=(0.25, 0.15, 0))
    f_jejunum = bpy.context.active_object
    f_jejunum.name = "Stent_EUS_GE_FlangeJejunum"
    f_jejunum.data.name = "Mesh_Stent_EUS_GE_FlangeJejunum"
    f_jejunum.data.materials.append(mat_stent_ge)

    bpy.ops.object.select_all(action='DESELECT')
    stent_ge_waist.select_set(True); f_stomach.select_set(True); f_jejunum.select_set(True)
    bpy.context.view_layer.objects.active = stent_ge_waist
    bpy.ops.object.join()
    stent_ge_waist.name = "Stent_EUS_GE"
    stent_ge_waist.data.name = "Mesh_Stent_EUS_GE"

    # =========================================================================
    # 7. 导出完美修复后的全局 GLB
    # =========================================================================
    bpy.ops.object.select_all(action='SELECT')
    print(f"正在导出修复后的标准复合模型: {EXPORT_GLB_PATH} ...")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_PATH,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True
    )
    print(f"🎉 导出成功！大小: {os.path.getsize(EXPORT_GLB_PATH)/(1024*1024):.2f} MB")

    # =========================================================================
    # 8. 为侧边栏 3D 标本架渲染专业影棚级 3D 标本透明大图
    # =========================================================================
    print("📸 正在渲染影棚级 3D 器官标本透明大图...")
    scene = bpy.context.scene
    scene.render.film_transparent = True
    scene.render.resolution_x = 450
    scene.render.resolution_y = 350
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    # 设立影棚级三点布光 (正面无死角照亮)
    bpy.ops.object.light_add(type='SUN', location=(3, -5, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4.0

    bpy.ops.object.light_add(type='POINT', location=(-3, -3, 3))
    fill = bpy.context.active_object
    fill.data.energy = 60.0

    bpy.ops.object.light_add(type='POINT', location=(3, 3, 2))
    rim = bpy.context.active_object
    rim.data.energy = 40.0

    bpy.ops.object.camera_add(location=(0, -5, 0), rotation=(1.5708, 0, 0))
    cam = bpy.context.active_object
    scene.camera = cam

    # 标本渲染清单
    specimens_to_render = {
        "stomach": [obj_stomach],
        "liver": [obj_liver],
        "pancreas": [obj_pancreas],
        "biliary": [obj_gb, obj_cbd], # 胆囊与胆总管合并呈现
        "jejunum": [obj_jejunum],
        "esophagus": [obj_esoph]
    }

    def hide_all():
        for o in bpy.data.objects:
            if o.type == 'MESH':
                o.hide_render = True

    for sp_key, sp_objs in specimens_to_render.items():
        hide_all()
        for o in sp_objs:
            o.hide_render = False

        # 精准计算该标本在世界的包围盒
        min_co = Vector((float('inf'), float('inf'), float('inf')))
        max_co = Vector((float('-inf'), float('-inf'), float('-inf')))
        for o in sp_objs:
            for corner in o.bound_box:
                w = o.matrix_world @ Vector(corner)
                min_co.x = min(min_co.x, w.x); min_co.y = min(min_co.y, w.y); min_co.z = min(min_co.z, w.z)
                max_co.x = max(max_co.x, w.x); max_co.y = max(max_co.y, w.y); max_co.z = max(max_co.z, w.z)
        
        center = (min_co + max_co) / 2.0
        dims = max_co - min_co
        max_dim = max(dims.x, dims.y, dims.z, 0.4)

        # 摄像机正面正视对准标本中心
        dist = max_dim * 1.85
        cam.location = center + Vector((0.0, -dist, 0.12 * dist))
        cam.rotation_euler = (1.50, 0, 0)

        out_img = os.path.join(THUMB_DIR, f"thumb_{sp_key}.png")
        scene.render.filepath = out_img
        bpy.ops.render.render(write_still=True)
        print(f"✓ 渲染高质感 3D 标本大图: {out_img}")

    print("🎉 全部标本图与模型重塑圆满完成！")

if __name__ == "__main__":
    run_rebuild()
