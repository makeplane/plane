#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract all Three.js examples from the official examples page.
Generates tracking CSV and examples data CSV.
Total: 556 examples across 13 categories.
"""

import csv
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent.parent / "data"
SKILL_DIR = Path(__file__).parent.parent

# All 556 examples extracted from https://threejs.org/examples/
# Data extracted via browser automation on 2026-01-21
ALL_EXAMPLES = [
    # webgl category (216 examples)
    {"category": "webgl", "file": "webgl_animation_keyframes.html"},
    {"category": "webgl", "file": "webgl_animation_skinning_blending.html"},
    {"category": "webgl", "file": "webgl_animation_skinning_additive_blending.html"},
    {"category": "webgl", "file": "webgl_animation_skinning_ik.html"},
    {"category": "webgl", "file": "webgl_animation_skinning_morph.html"},
    {"category": "webgl", "file": "webgl_animation_multiple.html"},
    {"category": "webgl", "file": "webgl_animation_walk.html"},
    {"category": "webgl", "file": "webgl_batch_lod_bvh.html"},
    {"category": "webgl", "file": "webgl_camera.html"},
    {"category": "webgl", "file": "webgl_camera_array.html"},
    {"category": "webgl", "file": "webgl_camera_logarithmicdepthbuffer.html"},
    {"category": "webgl", "file": "webgl_clipping.html"},
    {"category": "webgl", "file": "webgl_clipping_advanced.html"},
    {"category": "webgl", "file": "webgl_clipping_intersection.html"},
    {"category": "webgl", "file": "webgl_clipping_stencil.html"},
    {"category": "webgl", "file": "webgl_decals.html"},
    {"category": "webgl", "file": "webgl_depth_texture.html"},
    {"category": "webgl", "file": "webgl_effects_anaglyph.html"},
    {"category": "webgl", "file": "webgl_effects_ascii.html"},
    {"category": "webgl", "file": "webgl_effects_parallaxbarrier.html"},
    {"category": "webgl", "file": "webgl_effects_stereo.html"},
    {"category": "webgl", "file": "webgl_framebuffer_texture.html"},
    {"category": "webgl", "file": "webgl_geometries.html"},
    {"category": "webgl", "file": "webgl_geometry_colors.html"},
    {"category": "webgl", "file": "webgl_geometry_colors_lookuptable.html"},
    {"category": "webgl", "file": "webgl_geometry_convex.html"},
    {"category": "webgl", "file": "webgl_geometry_csg.html"},
    {"category": "webgl", "file": "webgl_geometry_cube.html"},
    {"category": "webgl", "file": "webgl_geometry_dynamic.html"},
    {"category": "webgl", "file": "webgl_geometry_extrude_shapes.html"},
    {"category": "webgl", "file": "webgl_geometry_extrude_splines.html"},
    {"category": "webgl", "file": "webgl_geometry_minecraft.html"},
    {"category": "webgl", "file": "webgl_geometry_nurbs.html"},
    {"category": "webgl", "file": "webgl_geometry_shapes.html"},
    {"category": "webgl", "file": "webgl_geometry_spline_editor.html"},
    {"category": "webgl", "file": "webgl_geometry_teapot.html"},
    {"category": "webgl", "file": "webgl_geometry_terrain.html"},
    {"category": "webgl", "file": "webgl_geometry_terrain_raycast.html"},
    {"category": "webgl", "file": "webgl_geometry_text.html"},
    {"category": "webgl", "file": "webgl_geometry_text_shapes.html"},
    {"category": "webgl", "file": "webgl_geometry_text_stroke.html"},
    {"category": "webgl", "file": "webgl_helpers.html"},
    {"category": "webgl", "file": "webgl_instancing_morph.html"},
    {"category": "webgl", "file": "webgl_instancing_dynamic.html"},
    {"category": "webgl", "file": "webgl_instancing_performance.html"},
    {"category": "webgl", "file": "webgl_instancing_raycast.html"},
    {"category": "webgl", "file": "webgl_instancing_scatter.html"},
    {"category": "webgl", "file": "webgl_interactive_buffergeometry.html"},
    {"category": "webgl", "file": "webgl_interactive_cubes.html"},
    {"category": "webgl", "file": "webgl_interactive_cubes_gpu.html"},
    {"category": "webgl", "file": "webgl_interactive_cubes_ortho.html"},
    {"category": "webgl", "file": "webgl_interactive_lines.html"},
    {"category": "webgl", "file": "webgl_interactive_points.html"},
    {"category": "webgl", "file": "webgl_interactive_raycasting_points.html"},
    {"category": "webgl", "file": "webgl_interactive_voxelpainter.html"},
    {"category": "webgl", "file": "webgl_lensflares.html"},
    {"category": "webgl", "file": "webgl_lightprobe.html"},
    {"category": "webgl", "file": "webgl_lightprobe_cubecamera.html"},
    {"category": "webgl", "file": "webgl_lights_hemisphere.html"},
    {"category": "webgl", "file": "webgl_lights_physical.html"},
    {"category": "webgl", "file": "webgl_lights_pointlights.html"},
    {"category": "webgl", "file": "webgl_lights_spotlights.html"},
    {"category": "webgl", "file": "webgl_lights_rectarealight.html"},
    {"category": "webgl", "file": "webgl_lines_colors.html"},
    {"category": "webgl", "file": "webgl_lines_dashed.html"},
    {"category": "webgl", "file": "webgl_lines_fat.html"},
    {"category": "webgl", "file": "webgl_lines_fat_raycasting.html"},
    {"category": "webgl", "file": "webgl_lines_fat_wireframe.html"},
    {"category": "webgl", "file": "webgl_loader_3dm.html"},
    {"category": "webgl", "file": "webgl_loader_3ds.html"},
    {"category": "webgl", "file": "webgl_loader_3dtiles.html"},
    {"category": "webgl", "file": "webgl_loader_3mf.html"},
    {"category": "webgl", "file": "webgl_loader_3mf_materials.html"},
    {"category": "webgl", "file": "webgl_loader_amf.html"},
    {"category": "webgl", "file": "webgl_loader_bvh.html"},
    {"category": "webgl", "file": "webgl_loader_collada.html"},
    {"category": "webgl", "file": "webgl_loader_collada_kinematics.html"},
    {"category": "webgl", "file": "webgl_loader_collada_skinning.html"},
    {"category": "webgl", "file": "webgl_loader_draco.html"},
    {"category": "webgl", "file": "webgl_loader_fbx.html"},
    {"category": "webgl", "file": "webgl_loader_fbx_nurbs.html"},
    {"category": "webgl", "file": "webgl_loader_gcode.html"},
    {"category": "webgl", "file": "webgl_loader_gltf.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_animation_pointer.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_progressive_lod.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_avif.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_compressed.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_dispersion.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_instancing.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_iridescence.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_lights.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_sheen.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_transmission.html"},
    {"category": "webgl", "file": "webgl_loader_gltf_variants.html"},
    {"category": "webgl", "file": "webgl_loader_ifc.html"},
    {"category": "webgl", "file": "webgl_loader_imagebitmap.html"},
    {"category": "webgl", "file": "webgl_loader_kmz.html"},
    {"category": "webgl", "file": "webgl_loader_ldraw.html"},
    {"category": "webgl", "file": "webgl_loader_lwo.html"},
    {"category": "webgl", "file": "webgl_loader_md2.html"},
    {"category": "webgl", "file": "webgl_loader_mdd.html"},
    {"category": "webgl", "file": "webgl_loader_nrrd.html"},
    {"category": "webgl", "file": "webgl_loader_obj.html"},
    {"category": "webgl", "file": "webgl_loader_pcd.html"},
    {"category": "webgl", "file": "webgl_loader_pdb.html"},
    {"category": "webgl", "file": "webgl_loader_ply.html"},
    {"category": "webgl", "file": "webgl_loader_stl.html"},
    {"category": "webgl", "file": "webgl_loader_svg.html"},
    {"category": "webgl", "file": "webgl_loader_texture_dds.html"},
    {"category": "webgl", "file": "webgl_loader_texture_exr.html"},
    {"category": "webgl", "file": "webgl_loader_texture_ultrahdr.html"},
    {"category": "webgl", "file": "webgl_loader_texture_hdr.html"},
    {"category": "webgl", "file": "webgl_loader_texture_ktx.html"},
    {"category": "webgl", "file": "webgl_loader_texture_ktx2.html"},
    {"category": "webgl", "file": "webgl_loader_texture_lottie.html"},
    {"category": "webgl", "file": "webgl_loader_texture_pvrtc.html"},
    {"category": "webgl", "file": "webgl_loader_texture_tga.html"},
    {"category": "webgl", "file": "webgl_loader_texture_tiff.html"},
    {"category": "webgl", "file": "webgl_loader_ttf.html"},
    {"category": "webgl", "file": "webgl_loader_usdz.html"},
    {"category": "webgl", "file": "webgl_loader_vox.html"},
    {"category": "webgl", "file": "webgl_loader_vrml.html"},
    {"category": "webgl", "file": "webgl_loader_vtk.html"},
    {"category": "webgl", "file": "webgl_loader_xyz.html"},
    {"category": "webgl", "file": "webgl_lod.html"},
    {"category": "webgl", "file": "webgl_marchingcubes.html"},
    {"category": "webgl", "file": "webgl_materials_alphahash.html"},
    {"category": "webgl", "file": "webgl_materials_blending.html"},
    {"category": "webgl", "file": "webgl_materials_blending_custom.html"},
    {"category": "webgl", "file": "webgl_materials_bumpmap.html"},
    {"category": "webgl", "file": "webgl_materials_car.html"},
    {"category": "webgl", "file": "webgl_materials_channels.html"},
    {"category": "webgl", "file": "webgl_materials_cubemap.html"},
    {"category": "webgl", "file": "webgl_materials_cubemap_dynamic.html"},
    {"category": "webgl", "file": "webgl_materials_cubemap_refraction.html"},
    {"category": "webgl", "file": "webgl_materials_cubemap_mipmaps.html"},
    {"category": "webgl", "file": "webgl_materials_cubemap_render_to_mipmaps.html"},
    {"category": "webgl", "file": "webgl_materials_displacementmap.html"},
    {"category": "webgl", "file": "webgl_materials_envmaps.html"},
    {"category": "webgl", "file": "webgl_materials_envmaps_exr.html"},
    {"category": "webgl", "file": "webgl_materials_envmaps_groundprojected.html"},
    {"category": "webgl", "file": "webgl_materials_envmaps_hdr.html"},
    {"category": "webgl", "file": "webgl_materials_envmaps_fasthdr.html"},
    {"category": "webgl", "file": "webgl_materials_matcap.html"},
    {"category": "webgl", "file": "webgl_materials_normalmap.html"},
    {"category": "webgl", "file": "webgl_materials_normalmap_object_space.html"},
    {"category": "webgl", "file": "webgl_materials_physical_clearcoat.html"},
    {"category": "webgl", "file": "webgl_materials_physical_transmission.html"},
    {"category": "webgl", "file": "webgl_materials_physical_transmission_alpha.html"},
    {"category": "webgl", "file": "webgl_materials_subsurface_scattering.html"},
    {"category": "webgl", "file": "webgl_materials_texture_anisotropy.html"},
    {"category": "webgl", "file": "webgl_materials_texture_canvas.html"},
    {"category": "webgl", "file": "webgl_materials_texture_filters.html"},
    {"category": "webgl", "file": "webgl_materials_texture_manualmipmap.html"},
    {"category": "webgl", "file": "webgl_materials_texture_partialupdate.html"},
    {"category": "webgl", "file": "webgl_materials_texture_rotation.html"},
    {"category": "webgl", "file": "webgl_materials_toon.html"},
    {"category": "webgl", "file": "webgl_materials_video.html"},
    {"category": "webgl", "file": "webgl_materials_video_webcam.html"},
    {"category": "webgl", "file": "webgl_materials_wireframe.html"},
    {"category": "webgl", "file": "webgl_pmrem_cubemap.html"},
    {"category": "webgl", "file": "webgl_pmrem_equirectangular.html"},
    {"category": "webgl", "file": "webgl_pmrem_test.html"},
    {"category": "webgl", "file": "webgl_math_obb.html"},
    {"category": "webgl", "file": "webgl_math_orientation_transform.html"},
    {"category": "webgl", "file": "webgl_mesh_batch.html"},
    {"category": "webgl", "file": "webgl_mirror.html"},
    {"category": "webgl", "file": "webgl_modifier_curve.html"},
    {"category": "webgl", "file": "webgl_modifier_curve_instanced.html"},
    {"category": "webgl", "file": "webgl_modifier_edgesplit.html"},
    {"category": "webgl", "file": "webgl_modifier_simplifier.html"},
    {"category": "webgl", "file": "webgl_modifier_subdivision.html"},
    {"category": "webgl", "file": "webgl_modifier_tessellation.html"},
    {"category": "webgl", "file": "webgl_morphtargets.html"},
    {"category": "webgl", "file": "webgl_morphtargets_face.html"},
    {"category": "webgl", "file": "webgl_morphtargets_horse.html"},
    {"category": "webgl", "file": "webgl_morphtargets_sphere.html"},
    {"category": "webgl", "file": "webgl_morphtargets_webcam.html"},
    {"category": "webgl", "file": "webgl_multiple_elements.html"},
    {"category": "webgl", "file": "webgl_multiple_elements_text.html"},
    {"category": "webgl", "file": "webgl_multiple_scenes_comparison.html"},
    {"category": "webgl", "file": "webgl_multiple_views.html"},
    {"category": "webgl", "file": "webgl_panorama_cube.html"},
    {"category": "webgl", "file": "webgl_panorama_equirectangular.html"},
    {"category": "webgl", "file": "webgl_points_billboards.html"},
    {"category": "webgl", "file": "webgl_points_dynamic.html"},
    {"category": "webgl", "file": "webgl_points_sprites.html"},
    {"category": "webgl", "file": "webgl_points_waves.html"},
    {"category": "webgl", "file": "webgl_portal.html"},
    {"category": "webgl", "file": "webgl_raycaster_bvh.html"},
    {"category": "webgl", "file": "webgl_raycaster_sprite.html"},
    {"category": "webgl", "file": "webgl_raycaster_texture.html"},
    {"category": "webgl", "file": "webgl_read_float_buffer.html"},
    {"category": "webgl", "file": "webgl_renderer_pathtracer.html"},
    {"category": "webgl", "file": "webgl_refraction.html"},
    {"category": "webgl", "file": "webgl_rtt.html"},
    {"category": "webgl", "file": "webgl_shader.html"},
    {"category": "webgl", "file": "webgl_shader_lava.html"},
    {"category": "webgl", "file": "webgl_shaders_ocean.html"},
    {"category": "webgl", "file": "webgl_shaders_sky.html"},
    {"category": "webgl", "file": "webgl_shadow_contact.html"},
    {"category": "webgl", "file": "webgl_shadowmap.html"},
    {"category": "webgl", "file": "webgl_shadowmap_performance.html"},
    {"category": "webgl", "file": "webgl_shadowmap_pointlight.html"},
    {"category": "webgl", "file": "webgl_shadowmap_viewer.html"},
    {"category": "webgl", "file": "webgl_shadowmap_vsm.html"},
    {"category": "webgl", "file": "webgl_shadowmesh.html"},
    {"category": "webgl", "file": "webgl_sprites.html"},
    {"category": "webgl", "file": "webgl_test_memory.html"},
    {"category": "webgl", "file": "webgl_test_memory2.html"},
    {"category": "webgl", "file": "webgl_test_wide_gamut.html"},
    {"category": "webgl", "file": "webgl_tonemapping.html"},
    {"category": "webgl", "file": "webgl_video_kinect.html"},
    {"category": "webgl", "file": "webgl_video_panorama_equirectangular.html"},
    {"category": "webgl", "file": "webgl_watch.html"},

    # webgl / postprocessing category (27 examples)
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_3dlut.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_advanced.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_afterimage.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_backgrounds.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_transition.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_dof.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_dof2.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_fxaa.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_glitch.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_godrays.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_gtao.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_rgb_halftone.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_masking.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_material_ao.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_ssaa.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_outline.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_pixel.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_procedural.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_sao.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_smaa.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_sobel.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_ssao.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_ssr.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_taa.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_unreal_bloom.html"},
    {"category": "webgl / postprocessing", "file": "webgl_postprocessing_unreal_bloom_selective.html"},

    # webgl / advanced category (48 examples)
    {"category": "webgl / advanced", "file": "webgl_clipculldistance.html"},
    {"category": "webgl / advanced", "file": "webgl_custom_attributes.html"},
    {"category": "webgl / advanced", "file": "webgl_custom_attributes_lines.html"},
    {"category": "webgl / advanced", "file": "webgl_custom_attributes_points.html"},
    {"category": "webgl / advanced", "file": "webgl_custom_attributes_points2.html"},
    {"category": "webgl / advanced", "file": "webgl_custom_attributes_points3.html"},
    {"category": "webgl / advanced", "file": "webgl_gpgpu_birds.html"},
    {"category": "webgl / advanced", "file": "webgl_gpgpu_birds_gltf.html"},
    {"category": "webgl / advanced", "file": "webgl_gpgpu_water.html"},
    {"category": "webgl / advanced", "file": "webgl_gpgpu_protoplanet.html"},
    {"category": "webgl / advanced", "file": "webgl_materials_modified.html"},
    {"category": "webgl / advanced", "file": "webgl_multiple_rendertargets.html"},
    {"category": "webgl / advanced", "file": "webgl_multisampled_renderbuffers.html"},
    {"category": "webgl / advanced", "file": "webgl_rendertarget_texture2darray.html"},
    {"category": "webgl / advanced", "file": "webgl_reversed_depth_buffer.html"},
    {"category": "webgl / advanced", "file": "webgl_shadowmap_csm.html"},
    {"category": "webgl / advanced", "file": "webgl_shadowmap_pcss.html"},
    {"category": "webgl / advanced", "file": "webgl_shadowmap_progressive.html"},
    {"category": "webgl / advanced", "file": "webgl_simple_gi.html"},
    {"category": "webgl / advanced", "file": "webgl_texture2darray.html"},
    {"category": "webgl / advanced", "file": "webgl_texture2darray_compressed.html"},
    {"category": "webgl / advanced", "file": "webgl_texture2darray_layerupdate.html"},
    {"category": "webgl / advanced", "file": "webgl_texture3d.html"},
    {"category": "webgl / advanced", "file": "webgl_texture3d_partialupdate.html"},
    {"category": "webgl / advanced", "file": "webgl_tiled_forward.html"},
    {"category": "webgl / advanced", "file": "webgl_ubo.html"},
    {"category": "webgl / advanced", "file": "webgl_ubo_arrays.html"},
    {"category": "webgl / advanced", "file": "webgl_worker_offscreencanvas.html"},

    # webgpu (wip) category (190 examples)
    {"category": "webgpu (wip)", "file": "webgpu_audio_processing.html"},
    {"category": "webgpu (wip)", "file": "webgpu_backdrop.html"},
    {"category": "webgpu (wip)", "file": "webgpu_backdrop_area.html"},
    {"category": "webgpu (wip)", "file": "webgpu_backdrop_water.html"},
    {"category": "webgpu (wip)", "file": "webgpu_camera_logarithmicdepthbuffer.html"},
    {"category": "webgpu (wip)", "file": "webgpu_centroid_sampling.html"},
    {"category": "webgpu (wip)", "file": "webgpu_clearcoat.html"},
    {"category": "webgpu (wip)", "file": "webgpu_clipping.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_audio.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_birds.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_cloth.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_geometry.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_particles.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_particles_fluid.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_particles_rain.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_particles_snow.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_points.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_reduce.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_sort_bitonic.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_texture.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_texture_3d.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_texture_pingpong.html"},
    {"category": "webgpu (wip)", "file": "webgpu_compute_water.html"},
    {"category": "webgpu (wip)", "file": "webgpu_cubemap_adjustments.html"},
    {"category": "webgpu (wip)", "file": "webgpu_cubemap_dynamic.html"},
    {"category": "webgpu (wip)", "file": "webgpu_cubemap_mix.html"},
    {"category": "webgpu (wip)", "file": "webgpu_custom_fog.html"},
    {"category": "webgpu (wip)", "file": "webgpu_custom_fog_background.html"},
    {"category": "webgpu (wip)", "file": "webgpu_depth_texture.html"},
    {"category": "webgpu (wip)", "file": "webgpu_display_stereo.html"},
    {"category": "webgpu (wip)", "file": "webgpu_equirectangular_projection.html"},
    {"category": "webgpu (wip)", "file": "webgpu_instancing.html"},
    {"category": "webgpu (wip)", "file": "webgpu_instancing_morph.html"},
    {"category": "webgpu (wip)", "file": "webgpu_instance_mesh.html"},
    {"category": "webgpu (wip)", "file": "webgpu_instance_points.html"},
    {"category": "webgpu (wip)", "file": "webgpu_instance_sprites.html"},
    {"category": "webgpu (wip)", "file": "webgpu_instance_uniform.html"},
    {"category": "webgpu (wip)", "file": "webgpu_interactive.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lensflares.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lightprobe.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lightprobe_cubecamera.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_ies_spotlight.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_physical.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_pointlights.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_projector.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_rectarealight.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_selective.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_spotlight.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lights_tiled.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lines_fat_raycasting.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lines_fat_wireframe.html"},
    {"category": "webgpu (wip)", "file": "webgpu_lines_fat.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_gltf.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_gltf_anisotropy.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_gltf_compressed.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_gltf_dispersion.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_gltf_iridescence.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_gltf_sheen.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_gltf_transmission.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_materialx.html"},
    {"category": "webgpu (wip)", "file": "webgpu_loader_texture_ktx2.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_alphahash.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_arrays.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_basic.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_curvature.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_displacementmap.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_envmaps.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_lightmap.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_matcap.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_sss.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_texture_anisotropy.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_texture_canvas.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_texture_partialupdate.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_toon.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_transmission.html"},
    {"category": "webgpu (wip)", "file": "webgpu_materials_video.html"},
    {"category": "webgpu (wip)", "file": "webgpu_mesh_batch.html"},
    {"category": "webgpu (wip)", "file": "webgpu_mirror.html"},
    {"category": "webgpu (wip)", "file": "webgpu_modifier_curve.html"},
    {"category": "webgpu (wip)", "file": "webgpu_morphtargets.html"},
    {"category": "webgpu (wip)", "file": "webgpu_morphtargets_face.html"},
    {"category": "webgpu (wip)", "file": "webgpu_mrt.html"},
    {"category": "webgpu (wip)", "file": "webgpu_multiple_canvas.html"},
    {"category": "webgpu (wip)", "file": "webgpu_multiple_elements.html"},
    {"category": "webgpu (wip)", "file": "webgpu_mrt_mask.html"},
    {"category": "webgpu (wip)", "file": "webgpu_multiple_rendertargets.html"},
    {"category": "webgpu (wip)", "file": "webgpu_multiple_rendertargets_readback.html"},
    {"category": "webgpu (wip)", "file": "webgpu_multisampled_renderbuffers.html"},
    {"category": "webgpu (wip)", "file": "webgpu_occlusion.html"},
    {"category": "webgpu (wip)", "file": "webgpu_ocean.html"},
    {"category": "webgpu (wip)", "file": "webgpu_parallax_uv.html"},
    {"category": "webgpu (wip)", "file": "webgpu_particles.html"},
    {"category": "webgpu (wip)", "file": "webgpu_performance.html"},
    {"category": "webgpu (wip)", "file": "webgpu_performance_renderbundle.html"},
    {"category": "webgpu (wip)", "file": "webgpu_pmrem_cubemap.html"},
    {"category": "webgpu (wip)", "file": "webgpu_pmrem_equirectangular.html"},
    {"category": "webgpu (wip)", "file": "webgpu_pmrem_scene.html"},
    {"category": "webgpu (wip)", "file": "webgpu_pmrem_test.html"},
    {"category": "webgpu (wip)", "file": "webgpu_portal.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_3dlut.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_afterimage.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_anamorphic.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_ao.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_bloom.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_bloom_emissive.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_bloom_selective.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_dof.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_fxaa.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_motion_blur.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_outline.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_smaa.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_sobel.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_ssr.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_sss.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_traa.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing_transition.html"},
    {"category": "webgpu (wip)", "file": "webgpu_postprocessing.html"},
    {"category": "webgpu (wip)", "file": "webgpu_procedural_texture.html"},
    {"category": "webgpu (wip)", "file": "webgpu_reflection.html"},
    {"category": "webgpu (wip)", "file": "webgpu_reflection_blurred.html"},
    {"category": "webgpu (wip)", "file": "webgpu_reflection_roughness.html"},
    {"category": "webgpu (wip)", "file": "webgpu_refraction.html"},
    {"category": "webgpu (wip)", "file": "webgpu_rendertarget_2d-array_3d.html"},
    {"category": "webgpu (wip)", "file": "webgpu_rtt.html"},
    {"category": "webgpu (wip)", "file": "webgpu_sandbox.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadertoy.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadow_contact.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadowmap.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadowmap_array.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadowmap_csm.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadowmap_opacity.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadowmap_pointlight.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadowmap_progressive.html"},
    {"category": "webgpu (wip)", "file": "webgpu_shadowmap_vsm.html"},
    {"category": "webgpu (wip)", "file": "webgpu_skinning.html"},
    {"category": "webgpu (wip)", "file": "webgpu_skinning_instancing.html"},
    {"category": "webgpu (wip)", "file": "webgpu_skinning_points.html"},
    {"category": "webgpu (wip)", "file": "webgpu_sky.html"},
    {"category": "webgpu (wip)", "file": "webgpu_sprites.html"},
    {"category": "webgpu (wip)", "file": "webgpu_storage_buffer.html"},
    {"category": "webgpu (wip)", "file": "webgpu_texturegrad.html"},
    {"category": "webgpu (wip)", "file": "webgpu_textures_2d-array.html"},
    {"category": "webgpu (wip)", "file": "webgpu_textures_3d.html"},
    {"category": "webgpu (wip)", "file": "webgpu_textures_anisotropy.html"},
    {"category": "webgpu (wip)", "file": "webgpu_textures_partialupdate.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tonemapping.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_angular_slicing.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_coffee_smoke.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_compute_attractors_particles.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_earth.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_editor.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_galaxy.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_halftone.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_interoperability.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_procedural_terrain.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_raging_sea.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_transpiler.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_vfx_flames.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_vfx_linkedparticles.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_vfx_tornado.html"},
    {"category": "webgpu (wip)", "file": "webgpu_tsl_wood.html"},
    {"category": "webgpu (wip)", "file": "webgpu_video_frame.html"},
    {"category": "webgpu (wip)", "file": "webgpu_video_panorama.html"},
    {"category": "webgpu (wip)", "file": "webgpu_volume_caustics.html"},
    {"category": "webgpu (wip)", "file": "webgpu_volume_cloud.html"},
    {"category": "webgpu (wip)", "file": "webgpu_volume_lighting.html"},
    {"category": "webgpu (wip)", "file": "webgpu_volume_lighting_rectarea.html"},
    {"category": "webgpu (wip)", "file": "webgpu_volume_perlin.html"},
    {"category": "webgpu (wip)", "file": "webgpu_water.html"},
    {"category": "webgpu (wip)", "file": "webgpu_xr_rollercoaster.html"},
    {"category": "webgpu (wip)", "file": "webgpu_xr_cubes.html"},
    {"category": "webgpu (wip)", "file": "webgpu_xr_native_layers.html"},

    # webaudio category (4 examples)
    {"category": "webaudio", "file": "webaudio_orientation.html"},
    {"category": "webaudio", "file": "webaudio_sandbox.html"},
    {"category": "webaudio", "file": "webaudio_timing.html"},
    {"category": "webaudio", "file": "webaudio_visualizer.html"},

    # webxr category (26 examples)
    {"category": "webxr", "file": "webxr_ar_camera_assisted.html"},
    {"category": "webxr", "file": "webxr_ar_cones.html"},
    {"category": "webxr", "file": "webxr_ar_hittest.html"},
    {"category": "webxr", "file": "webxr_ar_lighting.html"},
    {"category": "webxr", "file": "webxr_ar_plane_detection.html"},
    {"category": "webxr", "file": "webxr_vr_handinput.html"},
    {"category": "webxr", "file": "webxr_vr_handinput_cubes.html"},
    {"category": "webxr", "file": "webxr_vr_handinput_pointerclick.html"},
    {"category": "webxr", "file": "webxr_vr_handinput_pointerdrag.html"},
    {"category": "webxr", "file": "webxr_vr_handinput_pressbutton.html"},
    {"category": "webxr", "file": "webxr_vr_handinput_profiles.html"},
    {"category": "webxr", "file": "webxr_vr_layers.html"},
    {"category": "webxr", "file": "webxr_vr_panorama.html"},
    {"category": "webxr", "file": "webxr_vr_rollercoaster.html"},
    {"category": "webxr", "file": "webxr_vr_sandbox.html"},
    {"category": "webxr", "file": "webxr_vr_teleport.html"},
    {"category": "webxr", "file": "webxr_vr_video.html"},
    {"category": "webxr", "file": "webxr_xr_ballshooter.html"},
    {"category": "webxr", "file": "webxr_xr_controls_transform.html"},
    {"category": "webxr", "file": "webxr_xr_cubes.html"},
    {"category": "webxr", "file": "webxr_xr_dragging.html"},
    {"category": "webxr", "file": "webxr_xr_dragging_custom_depth.html"},
    {"category": "webxr", "file": "webxr_xr_haptics.html"},
    {"category": "webxr", "file": "webxr_xr_paint.html"},
    {"category": "webxr", "file": "webxr_xr_sculpt.html"},

    # games category (1 example)
    {"category": "games", "file": "games_fps.html"},

    # physics category (13 examples)
    {"category": "physics", "file": "physics_ammo_break.html"},
    {"category": "physics", "file": "physics_ammo_cloth.html"},
    {"category": "physics", "file": "physics_ammo_instancing.html"},
    {"category": "physics", "file": "physics_ammo_rope.html"},
    {"category": "physics", "file": "physics_ammo_terrain.html"},
    {"category": "physics", "file": "physics_ammo_volume.html"},
    {"category": "physics", "file": "physics_jolt_instancing.html"},
    {"category": "physics", "file": "physics_rapier_basic.html"},
    {"category": "physics", "file": "physics_rapier_instancing.html"},
    {"category": "physics", "file": "physics_rapier_joints.html"},
    {"category": "physics", "file": "physics_rapier_character_controller.html"},
    {"category": "physics", "file": "physics_rapier_vehicle_controller.html"},
    {"category": "physics", "file": "physics_rapier_terrain.html"},

    # misc category (20 examples)
    {"category": "misc", "file": "misc_animation_groups.html"},
    {"category": "misc", "file": "misc_animation_keys.html"},
    {"category": "misc", "file": "misc_boxselection.html"},
    {"category": "misc", "file": "misc_controls_arcball.html"},
    {"category": "misc", "file": "misc_controls_drag.html"},
    {"category": "misc", "file": "misc_controls_fly.html"},
    {"category": "misc", "file": "misc_controls_map.html"},
    {"category": "misc", "file": "misc_controls_orbit.html"},
    {"category": "misc", "file": "misc_controls_pointerlock.html"},
    {"category": "misc", "file": "misc_controls_trackball.html"},
    {"category": "misc", "file": "misc_controls_transform.html"},
    {"category": "misc", "file": "misc_exporter_draco.html"},
    {"category": "misc", "file": "misc_exporter_gltf.html"},
    {"category": "misc", "file": "misc_exporter_obj.html"},
    {"category": "misc", "file": "misc_exporter_ply.html"},
    {"category": "misc", "file": "misc_exporter_stl.html"},
    {"category": "misc", "file": "misc_exporter_usdz.html"},
    {"category": "misc", "file": "misc_exporter_exr.html"},
    {"category": "misc", "file": "misc_exporter_ktx2.html"},
    {"category": "misc", "file": "misc_raycaster_helper.html"},

    # css2d category (1 example)
    {"category": "css2d", "file": "css2d_label.html"},

    # css3d category (6 examples)
    {"category": "css3d", "file": "css3d_molecules.html"},
    {"category": "css3d", "file": "css3d_orthographic.html"},
    {"category": "css3d", "file": "css3d_periodictable.html"},
    {"category": "css3d", "file": "css3d_sandbox.html"},
    {"category": "css3d", "file": "css3d_sprites.html"},
    {"category": "css3d", "file": "css3d_youtube.html"},

    # svg category (2 examples)
    {"category": "svg", "file": "svg_lines.html"},
    {"category": "svg", "file": "svg_sandbox.html"},

    # tests category (2 examples)
    {"category": "tests", "file": "webgl_furnace_test.html"},
    {"category": "tests", "file": "misc_uv_tests.html"},
]


def extract_keywords_from_file(filename):
    """Extract keywords from filename"""
    base = filename.replace('.html', '')
    parts = base.split('_')
    return ', '.join([p for p in parts if len(p) > 1])


def extract_name_from_file(filename):
    """Extract display name from filename"""
    base = filename.replace('.html', '')
    parts = base.split('_')[1:]  # Remove prefix like 'webgl'
    return ' / '.join(parts)


def generate_tracking_csv():
    """Generate tracking CSV with all 556 examples"""
    tracking_file = SKILL_DIR / "extraction-progress.csv"

    rows = []
    for i, ex in enumerate(ALL_EXAMPLES, 1):
        rows.append({
            'ID': i,
            'Category': ex['category'],
            'Name': extract_name_from_file(ex['file']),
            'File': ex['file'],
            'URL': f"https://threejs.org/examples/{ex['file']}",
            'Keywords': extract_keywords_from_file(ex['file']),
            'Status': 'pending',
            'Extracted_At': ''
        })

    with open(tracking_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['ID', 'Category', 'Name', 'File', 'URL', 'Keywords', 'Status', 'Extracted_At'])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} entries in {tracking_file}")
    return rows


def generate_examples_csv():
    """Generate examples-all.csv with all 556 examples"""
    examples_file = DATA_DIR / "examples-all.csv"
    DATA_DIR.mkdir(exist_ok=True)

    rows = []
    for i, ex in enumerate(ALL_EXAMPLES, 1):
        name = extract_name_from_file(ex['file'])
        keywords = extract_keywords_from_file(ex['file'])

        # Determine complexity based on category
        complexity = "medium"
        if "advanced" in ex['category'] or "gpgpu" in ex['file'] or "compute" in ex['file']:
            complexity = "high"
        elif "basic" in ex['file'] or ex['category'] in ['css2d', 'css3d', 'svg']:
            complexity = "low"

        # Generate use cases based on keywords
        use_cases = []
        file_lower = ex['file'].lower()
        if 'animation' in file_lower:
            use_cases.append('character animation')
        if 'loader' in file_lower:
            use_cases.append('model loading')
        if 'material' in file_lower:
            use_cases.append('material effects')
        if 'postprocessing' in file_lower:
            use_cases.append('visual effects')
        if 'shadow' in file_lower:
            use_cases.append('realistic lighting')
        if 'physics' in file_lower:
            use_cases.append('physics simulation')
        if 'xr' in file_lower or 'vr' in file_lower or 'ar' in file_lower:
            use_cases.append('VR/AR experience')
        if 'interactive' in file_lower or 'raycaster' in file_lower:
            use_cases.append('user interaction')
        if 'particle' in file_lower or 'points' in file_lower:
            use_cases.append('particle effects')
        if 'terrain' in file_lower or 'geometry' in file_lower:
            use_cases.append('procedural generation')
        if not use_cases:
            use_cases.append('3D visualization')

        # Generate description
        desc = f"Three.js {ex['category']} example demonstrating {name.replace(' / ', ', ')}"

        rows.append({
            'ID': i,
            'Category': ex['category'],
            'Name': name,
            'File': ex['file'],
            'URL': f"https://threejs.org/examples/{ex['file']}",
            'Keywords': keywords,
            'Complexity': complexity,
            'Use Cases': '; '.join(use_cases),
            'Description': desc
        })

    with open(examples_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['ID', 'Category', 'Name', 'File', 'URL', 'Keywords', 'Complexity', 'Use Cases', 'Description'])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} entries in {examples_file}")
    return rows


if __name__ == "__main__":
    print("Generating Three.js skill data files...")
    print(f"Total examples: {len(ALL_EXAMPLES)}")

    # Count by category
    categories = {}
    for ex in ALL_EXAMPLES:
        cat = ex['category']
        categories[cat] = categories.get(cat, 0) + 1

    print("\nExamples by category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

    print("\nGenerating files...")
    generate_tracking_csv()
    generate_examples_csv()
    print("\nDone!")
