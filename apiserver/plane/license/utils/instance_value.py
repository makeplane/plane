# Helper function to return value from the passed key
def get_configuration_value(query, key, default=None):
    for item in query:
        if item['key'] == key:
            return item.get("value", default)
    return default
