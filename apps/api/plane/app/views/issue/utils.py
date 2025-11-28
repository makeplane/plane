from plane.db.models import Issue


def is_allowed_to_add_child(parent_issue: Issue, sub_issue: Issue):
    """判断在给定父事项下是否允许添加该子事项类型。

    Args:
        parent_issue (Issue): 父事项实例，依据其 `type.name` 进行校验。
        sub_issue (Issue): 子事项实例，依据其 `type.name` 进行校验。

    Returns:
        bool: 若符合类型层级规则则返回 True，否则返回 False。

    规则：
    - 父为“史诗”时，仅允许子为“特性”。
    - 父为“特性”时，仅允许子为“用户故事”。
    - 父为“用户故事”时，子不可为“史诗”或“特性”。
    - 其他父类型默认允许。
    """
    p = parent_issue.type.name
    c = sub_issue.type.name
    if p == '史诗':
        return c == '特性'
    if p == '特性':
        return c == '用户故事'
    if p == '用户故事':
        return c not in {'史诗', '特性'}
    return True


def is_allowed_to_add_parent(parent_issue: Issue, sub_issue: Issue | str):
    """判断给定事项是否允许添加该父事项类型。

    Args:
        parent_issue (Issue): 拟添加的父事项实例，依据其 `type.name` 进行校验。
        sub_issue (Issue): 当前事项实例，依据其 `type.name` 进行校验。

    Returns:
        bool: 若符合类型层级规则则返回 True，否则返回 False。

    规则：
    - 子为“史诗”时，不允许添加父级。
    - 子为“用户故事”时，父必须为“特性”。
    - 子为“特性”时，父必须为“史诗”。
    - 其他子类型时，父必须为“用户故事”。
    """
    p = parent_issue.type.name
    c = sub_issue.type.name if isinstance(sub_issue,Issue) else sub_issue
    if c == '史诗':
        return False
    if c == '用户故事':
        return p == '特性'
    if c == '特性':
        return p == '史诗'
    return p == '用户故事'
