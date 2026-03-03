"""Global default labels and modules for newly created projects."""

from plane.db.models import Label, Module
from plane.db.models.module import ModuleStatus

# Defaults copied from:
# "MEJORAMIENTO DEL SERVICIO DE PRÁCTICA DEPORTIVA Y/O RECREATIVA..."
DEFAULT_PROJECT_MODULES = (
    "ESPECIALISTAS CIVIL / ESTRUCTURAS",
    "ESPECIALISTA EN GEOTECNIA",
    "TOPO\u0301GRAFO",
    "ESPECIALISTA SANITARIO",
    "ESPECIALISTA EL\u00c9CTRICO",
    "ESPECIALISTA AMBIENTAL",
    "ESPECIALISTA EN SEGURIDAD Y SALUD",
    "ESPECIALISTAS EN COSTOS Y PRESUPUESTOS",
    "ESPECIALISTA EN METRADOS",
    "ARQUITECTOS",
    "DIBUJANTES CAD",
    "MODELADOR BIM",
    "PRACTICANTE",
    "JEFE DE PROYECTO",
    "ARQUELOGO",
    "TRABAJADOR SOCIAL",
)

DEFAULT_PROJECT_LABELS = (
    ("OBSERVADO EXTERNO", "#eb144c"),
    ("OBSERVADO INTERNO", "#eb144c"),
    ("00 DOC. DE PRESENTACION", "#8ed1fc"),
    ("01 RESUMEN EJECUTIVO", "#8ed1fc"),
    ("03 MEMORIA DESCRIPTIVA", "#8ed1fc"),
    ("04 ESPECIFICACIONES TECNICAS", "#8ed1fc"),
    ("05 METRADOS", "#8ed1fc"),
    ("06 COSTOS Y PRESUPUESTOS", "#8ed1fc"),
    ("08 ESTUDIOS BASICOS", "#8ed1fc"),
    ("07 CRONOGRMAS", "#8ed1fc"),
    ("09 MEMORIAS DE CALCULO", "#8ed1fc"),
    ("10 PLANOS", "#8ed1fc"),
    ("11 ANEXOS", "#8ed1fc"),
)


def apply_project_defaults(project, user=None):
    """Create default labels and modules for a project.

    Idempotent by name: if a label/module with the same name already exists
    in the project, it will be skipped.
    """

    existing_module_names = set(
        Module.objects.filter(project=project, deleted_at__isnull=True).values_list("name", flat=True)
    )
    existing_label_names = set(
        Label.objects.filter(project=project, deleted_at__isnull=True).values_list("name", flat=True)
    )

    for module_name in DEFAULT_PROJECT_MODULES:
        if module_name in existing_module_names:
            continue
        Module.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            name=module_name,
            status=ModuleStatus.BACKLOG,
            created_by=user,
        )

    for label_name, label_color in DEFAULT_PROJECT_LABELS:
        if label_name in existing_label_names:
            continue
        Label.objects.create(
            project=project,
            workspace_id=project.workspace_id,
            name=label_name,
            color=label_color,
            created_by=user,
        )
