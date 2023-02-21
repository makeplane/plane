def group_results(results_data, group_by):
    """
    Utility function to group data into a given attribute.
    Function can group attributes of string and list type.
    """
    response_dict = dict()

    for value in results_data:
        group_attribute = value.get(group_by, None)
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