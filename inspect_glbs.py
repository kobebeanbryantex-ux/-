import bpy, os

def inspect_file(filepath):
    print('========================================')
    print('Inspect File:', filepath)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=filepath)
    print('Object Count:', len(bpy.data.objects))
    for obj in bpy.data.objects:
        v_count = len(obj.data.vertices) if obj.type == 'MESH' and obj.data else 0
        mat_names = [m.name for m in obj.data.materials if m] if obj.type == 'MESH' and obj.data else []
        print(f' - Object: {obj.name}, Type: {obj.type}, Vertices: {v_count}, Mats: {mat_names}')
        print(f'   Loc: {obj.location}, Scale: {obj.scale}')

inspect_file(r'EUS_手术解说工具\02_器官模型\肝脏\liver.glb')
inspect_file(r'EUS_手术解说工具\02_器官模型\胰腺\pancreas.glb')
