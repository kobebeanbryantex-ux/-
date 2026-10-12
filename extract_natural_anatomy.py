"""
=============================================================================
EUS 手术解说工具 · 100% 保持人体真实原生解剖学位置装配与手术支架生成
=============================================================================
原理：
直接基于 Z-Anatomy 医学级人体原生装配体系（VisceralSystem100.fbx），
严格保持人体解剖学原始坐标系（食管接贲门、幽门接十二指肠、十二指肠包绕胰腺、
胆总管开口于大乳头、胆囊附于肝窝），绝不单独人为打乱平移！
=============================================================================
"""

import bpy
import os
import math
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = SCRIPT_DIR

FBX_SOURCE = r'C:\Users\wuhaotian\Desktop\Z-Anatomy-PC-Version\Resources\Models\FBX\VisceralSystem100.fbx'
EXPORT_DIR = os.path.join(PROJECT_ROOT, "EUS_手术解说工具", "06_前端项目", "public", "models")
EXPORT_GLB_PATH = os.path.join(EXPORT_DIR, "digestive_system.glb")

def hex_to_linear_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0
    to_linear = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (to_linear(r), to_linear(g), to_linear(b), 1.0)

def create_mat(name, hex_color, alpha_val, roughness=0.35, transmission=0.15, metallic=0.0):
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
    if "Alpha" in bsdf.inputs: bsdf.inputs["Alpha"].default_value = alpha_val
    if "Metallic" in bsdf.inputs: bsdf.inputs["Metallic"].default_value = metallic
    if "Transmission Weight" in bsdf.inputs: bsdf.inputs["Transmission Weight"].default_value = transmission
    elif "Transmission" in bsdf.inputs: bsdf.inputs["Transmission"].default_value = transmission

    if hasattr(mat, "blend_method"): mat.blend_method = 'BLEND'
    if hasattr(mat, "shadow_method"): mat.shadow_method = 'HASHED'
    return mat

def create_curve_tube(name, points, bevel_depth, mat, parent_collection):
    curve_data = bpy.data.curves.new(name=name, type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = bevel_depth
    curve_data.bevel_resolution = 8
    curve_data.use_fill_caps = True

    polyline = curve_data.splines.new('BEZIER')
    polyline.bezier_points.add(len(points) - 1)
    for i, p in enumerate(points):
        bp = polyline.bezier_points[i]
        bp.co = p
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    obj = bpy.data.objects.new(name=name, object_data=curve_data)
    parent_collection.objects.link(obj)
    
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.data.materials.append(mat)
    return obj

def run():
    print("🚀 正在从 Z-Anatomy 载入标准人体医学解剖整体系统...")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=FBX_SOURCE)

    # 1. 过滤：只保留上消化道与肝胆胰核心器官，严格维持原生相对空间坐标！
    keep_rules = {
        "胃": {
            "match": ["stomach", "fundus of stomach", "body of stomach", "pyloric antrum", "pyloric part", "lesser curvature", "greater curvature"],
            "exclude": ["cardiac impression", "bed of stomach"],
            "mat": create_mat("Stomach", "#F6A8B8", 0.75, roughness=0.35)
        },
        "食管": {
            "match": ["oesophagus", "esophagus"],
            "exclude": ["impression"],
            "mat": create_mat("Esophagus", "#E4D4E8", 0.70, roughness=0.35)
        },
        "肝脏": {
            "match": ["liver", "left lobe of liver", "right lobe of liver", "left anterior lateral segment", "left posterior lateral segment"],
            "exclude": ["impression", "fossa for gallbladder", "bare area"],
            "mat": create_mat("Liver", "#9E2B25", 0.75, roughness=0.35)
        },
        "胆囊": {
            "match": ["gallbladder", "body of gallbladder", "fundus of gallbladder", "neck of gallbladder", "infundibulum of gallbladder"],
            "exclude": ["fossa"],
            "mat": create_mat("Gallbladder", "#388E3C", 0.85, roughness=0.3)
        },
        "胆总管": {
            "match": ["bile duct", "extrahepatic bile ducts"],
            "exclude": [],
            "mat": create_mat("CBD", "#4CAF50", 0.90, roughness=0.3)
        },
        "胰腺": {
            "match": ["pancreas", "pancreatic duct", "head of pancreas", "body of pancreas", "tail of pancreas"],
            "exclude": ["notch", "surface", "border"],
            "mat": create_mat("Pancreas", "#F4D06F", 0.65, roughness=0.4)
        },
        "十二指肠": {
            "match": ["duodenum"],
            "exclude": ["impression"],
            "mat": create_mat("Duodenum", "#F8B195", 0.70, roughness=0.35)
        }
    }

    # 识别并分类网格
    kept_mesh_objects = []
    to_delete = []

    for obj in list(bpy.data.objects):
        if obj.type != 'MESH':
            to_delete.append(obj)
            continue
        
        name_lower = obj.name.lower()
        matched_category = None

        for cat_name, rule in keep_rules.items():
            is_match = any(m in name_lower for m in rule["match"])
            is_exclude = any(e in name_lower for e in rule["exclude"])
            if is_match and not is_exclude:
                matched_category = cat_name
                break

        if matched_category:
            obj.data.materials.clear()
            obj.data.materials.append(keep_rules[matched_category]["mat"])
            kept_mesh_objects.append(obj)
        else:
            to_delete.append(obj)

    # 清除无关器官
    for obj in to_delete:
        bpy.data.objects.remove(obj, do_unlink=True)

    print(f"✓ 成功筛选出 {len(kept_mesh_objects)} 个标准原生医学解剖网格！")

    # =========================================================================
    # 2. 计算原生器官位置并创建 4 大手术 3D 实体支架
    # =========================================================================
    stent_col = bpy.data.collections.new("Surgical_Stents")
    bpy.context.scene.collection.children.link(stent_col)

    # 获得胃、肝脏、十二指肠的边界
    # 在原生 Z-Anatomy 坐标系中计算包围盒中心
    min_co = Vector((float('inf'), float('inf'), float('inf')))
    max_co = Vector((float('-inf'), float('-inf'), float('-inf')))
    for obj in kept_mesh_objects:
        for corner in obj.bound_box:
            wc = obj.matrix_world @ Vector(corner)
            min_co.x = min(min_co.x, wc.x); min_co.y = min(min_co.y, wc.y); min_co.z = min(min_co.z, wc.z)
            max_co.x = max(max_co.x, wc.x); max_co.y = max(max_co.y, wc.y); max_co.z = max(max_co.z, wc.z)

    center = (min_co + max_co) / 2.0
    size = max_co - min_co
    print(f"原生内脏系统总包围盒中心: ({center.x:.2f}, {center.y:.2f}, {center.z:.2f}), 尺寸: {size.x:.2f}x{size.y:.2f}x{size.z:.2f}")

    # 将整体原生系统平移居中并适度缩放
    scale_factor = 3.2 / max(size.x, size.y, size.z)
    for obj in kept_mesh_objects:
        obj.location = (obj.location - center) * scale_factor
        obj.scale = obj.scale * scale_factor

    bpy.context.view_layer.update()

    # 在标准居中坐标系下，生成单根优雅下行的空肠起始段 (穿至胃大弯下方)
    mat_jejunum = create_mat("Jejunum", "#F4A460", 0.80, roughness=0.35)
    jejunum_pts = [
        Vector((-0.10, -0.45, 0.05)),
        Vector((0.25, -0.55, 0.15)),
        Vector((0.65, -0.50, 0.20)),
        Vector((0.95, -0.70, 0.18)),
        Vector((0.85, -1.10, 0.10))
    ]
    jejunum_mesh = create_curve_tube("Jejunum_Loop", jejunum_pts, 0.09, mat_jejunum, stent_col)
    kept_mesh_objects.append(jejunum_mesh)

    # 4 大 3D 实体手术支架 (严格对应手绘红线)
    # 1. EUS-HGS (红宝石色拱形引流管：胃小弯上部 -> 肝左叶肝内胆管 B2/B3)
    mat_hgs = create_mat("Stent_EUS_HGS", "#E53935", 0.95, roughness=0.2, transmission=0.1)
    pts_hgs = [
        Vector((0.35, 0.65, 0.15)),
        Vector((0.05, 0.95, 0.20)),
        Vector((-0.55, 0.80, 0.12))
    ]
    kept_mesh_objects.append(create_curve_tube("Stent_EUS_HGS", pts_hgs, 0.032, mat_hgs, stent_col))

    # 2. EUS-CDS (亮橙色短程吻合支架：十二指肠球部 -> 胆总管中段)
    mat_cds = create_mat("Stent_EUS_CDS", "#FB8C00", 0.95, roughness=0.2, metallic=0.7)
    pts_cds = [
        Vector((-0.35, 0.10, 0.15)),
        Vector((-0.50, 0.15, 0.12)),
        Vector((-0.65, 0.20, 0.10))
    ]
    kept_mesh_objects.append(create_curve_tube("Stent_EUS_CDS", pts_cds, 0.038, mat_cds, stent_col))

    # 3. EUS-PD (紫红色胰管引流支架：胃后壁 -> 胰腺主胰管)
    mat_pd = create_mat("Stent_EUS_PD", "#8E24AA", 0.95, roughness=0.25)
    pts_pd = [
        Vector((0.25, 0.20, 0.10)),
        Vector((0.10, 0.10, -0.05)),
        Vector((-0.15, 0.05, -0.18))
    ]
    kept_mesh_objects.append(create_curve_tube("Stent_EUS_PD", pts_pd, 0.028, mat_pd, stent_col))

    # 4. EUS-GE (金黄色双蘑菇头金属支架：胃大弯下壁 -> 空肠)
    mat_ge = create_mat("Stent_EUS_GE", "#FFD700", 0.95, roughness=0.25, metallic=0.9)
    pts_ge = [
        Vector((0.62, -0.15, 0.22)),
        Vector((0.63, -0.32, 0.21)),
        Vector((0.65, -0.50, 0.20))
    ]
    kept_mesh_objects.append(create_curve_tube("Stent_EUS_GE_Waist", pts_ge, 0.055, mat_ge, stent_col))

    bpy.ops.mesh.primitive_torus_add(major_radius=0.10, minor_radius=0.03, location=(0.62, -0.15, 0.22), rotation=(0.3, 0.2, 0))
    flange1 = bpy.context.active_object
    flange1.name = "Stent_EUS_GE_FlangeStomach"
    flange1.data.materials.append(mat_ge)
    stent_col.objects.link(flange1)
    if flange1.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(flange1)
    kept_mesh_objects.append(flange1)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.10, minor_radius=0.03, location=(0.65, -0.50, 0.20), rotation=(0.3, 0.2, 0))
    flange2 = bpy.context.active_object
    flange2.name = "Stent_EUS_GE_FlangeJejunum"
    flange2.data.materials.append(mat_ge)
    stent_col.objects.link(flange2)
    if flange2.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(flange2)
    kept_mesh_objects.append(flange2)

    # 3. 导出为 GLB
    os.makedirs(EXPORT_DIR, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in kept_mesh_objects: obj.select_set(True)

    print(f"正在导出标准人体解剖 3D 模型: {EXPORT_GLB_PATH} ...")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB_PATH,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True
    )
    print(f"🎉 导出成功！文件大小: {os.path.getsize(EXPORT_GLB_PATH)/(1024*1024):.2f} MB")

if __name__ == "__main__":
    run()
