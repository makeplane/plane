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


def group_results(results_data, group_by, sub_group_by=False):
    """group results data into certain group_by

    Args:
        results_data (obj): complete results data
        group_by (key): string

    Returns:
        obj: grouped results
    """
    if sub_group_by:
        main_responsive_dict = dict()

        if sub_group_by == "priority":
            main_responsive_dict = {
                "urgent": {},
                "high": {},
                "medium": {},
                "low": {},
                "none": {},
            }

        for value in results_data:
            main_group_attribute = resolve_keys(sub_group_by, value)
            if str(main_group_attribute) not in main_responsive_dict:
                main_responsive_dict[str(main_group_attribute)] = {}
            group_attribute = resolve_keys(group_by, value)
            if str(group_attribute) in main_responsive_dict:
                main_responsive_dict[str(main_group_attribute)][str(group_attribute)].append(value)
            else:
                main_responsive_dict[str(main_group_attribute)][str(group_attribute)] = []
                main_responsive_dict[str(main_group_attribute)][str(group_attribute)].append(value)    

        return main_responsive_dict            

    else:
        response_dict = dict()

        if group_by == "priority":
            response_dict = {
                "urgent": [],
                "high": [],
                "medium": [],
                "low": [],
                "none": [],
            }

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
