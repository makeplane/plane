def resolve_keys(group_keys, value):
    """resolve keys to a key which will be used for
    grouping

    Args:
        group_keys (string): key which will be used for grouping
        value (obj): data value

    Returns:
        string: the key which will be used for
    """
    keys = group_keys.split(".")
    for key in keys:
        value = value.get(key, None)
    return value


def group_results(results_data, group_by):
    """group results data into certain group_by

    Args:
        results_data (obj): complete results data
        group_by (key): string

    Returns:
        obj: grouped results
    """
    response_dict = dict()

    for value in results_data:
        group_attribute = resolve_keys(group_by, value)
        if isinstance(group_attribute, list):
            if len(group_attribute):
                for attrib in group_attribute:
                    if str(attrib) in response_dict:
                        response_dict[str(attrib)].append(value)
                    else:
                        response_dict[str(attrib)] = []
                        response_dict[str(attrib)].append(value)
            else:
                if str(None) in response_dict:
                    response_dict[str(None)].append(value)
                else:
                    response_dict[str(None)] = []
                    response_dict[str(None)].append(value)
        else:
            if str(group_attribute) in response_dict:
                response_dict[str(group_attribute)].append(value)
            else:
                response_dict[str(group_attribute)] = []
                response_dict[str(group_attribute)].append(value)

    return response_dict
