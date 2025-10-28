from .core import core_config_variables
from .extended import extended_config_variables

instance_config_variables = [*core_config_variables, *extended_config_variables]
