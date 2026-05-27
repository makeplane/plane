# Zebaria fork: workspace credentials/connections used by the silo
# integrations service. Restores the data model that Plane Commercial
# carries (workspace_credentials / workspace_connections /
# workspace_user_connections / workspace_entity_connections) so we can
# wire Slack and GitHub integrations on the Community Edition base.
#
# Plane CE has only the legacy v0 integration tables (Integration,
# WorkspaceIntegration, SlackProjectSync, Github*Sync). Those stay
# alone; this app sits next to them with the newer schema silo expects.
default_app_config = "plane.connections.apps.ConnectionsConfig"