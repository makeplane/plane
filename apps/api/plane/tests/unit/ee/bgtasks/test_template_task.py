import pytest
from unittest.mock import patch
import uuid
from uuid import uuid4
from datetime import datetime

from plane.db.models import (
    Issue,
    IssueType,
    Label,
    State,
    Estimate,
    EstimatePoint,
    ProjectIssueType,
    IssueAssignee,
    IssueLabel,
    IssueActivity,
    IssueSequence,
    Project,
)
from plane.ee.models import (
    ProjectTemplate,
    WorkitemTemplate,
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    PropertyTypeEnum,
    Template,
)
from plane.ee.bgtasks.template_task import (
    create_project_from_template,
    create_subworkitems,
    create_estimates,
    create_labels,
    create_workitem_types,
    create_epics,
    create_issue_property_values,
    _get_property_value_data,
    _parse_datetime_value,
    get_random_color,
)


@pytest.fixture
def template_project(db, workspace):
    """Create and return a template project instance"""
    template_project = Project.objects.create(
        workspace=workspace,
        name="Test Template Project",
        description="A test template project",
        identifier="test12",
    )
    return template_project


def template_states():
    """Create and return a list of template states"""
    return [
        {
            "id": str(uuid4()),
            "name": "Backlog",
            "group": "backlog",
            "default": False,
        },
        {
            "id": str(uuid4()),
            "name": "Todo",
            "group": "unstarted",
            "default": True,
        },
        {
            "id": str(uuid4()),
            "name": "In Progress",
            "group": "started",
            "default": False,
        },
        {
            "id": str(uuid4()),
            "name": "Done",
            "group": "completed",
            "default": False,
        },
        {
            "id": str(uuid4()),
            "name": "Cancelled",
            "group": "cancelled",
            "default": False,
        },
    ]


def template_labels():
    """Create and return a list of template labels"""
    return [
        {"id": str(uuid4()), "name": "Bug", "color": "#ff0000"},
        {"id": str(uuid4()), "name": "Feature", "color": "#00ff00"},
    ]


def template_workitem_types():
    """Create and return a list of template workitem types"""
    return [
        {
            "id": str(uuid4()),
            "name": "Task",
            "description": "A task workitem type",
            "is_default": True,
            "logo_props": {},
            "properties": [
                {
                    "id": str(uuid4()),
                    "display_name": "Priority",
                    "property_type": PropertyTypeEnum.OPTION,
                    "logo_props": {},
                    "is_required": False,
                    "settings": {},
                    "is_active": True,
                    "is_multi": False,
                    "options": [
                        {
                            "id": str(uuid4()),
                            "name": "High",
                            "sort_order": 1,
                            "is_active": True,
                            "is_default": False,
                            "logo_props": {},
                        }
                    ],
                }
            ],
        }
    ]


@pytest.fixture
def project_template(db, workspace, create_user):
    """Create and return a project template instance"""
    template = Template.objects.create(
        workspace=workspace,
        name="Test Template",
        description="A test template",
        created_by=create_user,
        template_type=Template.TemplateType.PROJECT,
    )
    project_template = ProjectTemplate.objects.create(
        template=template,
        workspace=workspace,
        name="Test Project Template 1",
        description="A test project template",
        created_by=create_user,
        estimates={
            "name": "Story Points",
            "type": "categories",
            "points": [
                {"id": str(uuid4()), "key": "0", "value": 0},
                {"id": str(uuid4()), "key": "1", "value": 1},
                {"id": str(uuid4()), "key": "2", "value": 2},
            ],
        },
        labels=template_labels(),
        workitem_types=template_workitem_types(),
        epics={
            "name": "Epic",
            "description": "Epic workitem type",
            "properties": [
                {
                    "display_name": "Epic Property",
                    "property_type": PropertyTypeEnum.TEXT,
                    "logo_props": {},
                    "is_required": False,
                    "settings": {},
                    "is_active": True,
                    "is_multi": False,
                }
            ],
        },
        states=template_states(),
    )
    return project_template


@pytest.fixture
def state_map(db, project, create_user):
    """Create and return a list of common states"""
    state_map = {}
    for state_data in template_states():
        created_state = State.objects.create(
            project=project,
            workspace=project.workspace,
            name=state_data["name"],
            group=state_data["group"],
            default=state_data["default"],
            created_by=create_user,
        )
        state_map[state_data["id"]] = str(created_state.id)

    return state_map


@pytest.fixture
def labels(db, project, create_user, workspace):
    """Create and return a list of labels"""
    labels = []
    labels = Label.objects.bulk_create(
        [
            Label(
                name=label_data["name"],
                color=label_data["color"],
                project=project,
                workspace=workspace,
                created_by=create_user,
            )
            for label_data in template_labels()
        ]
    )
    return labels


@pytest.fixture
def issue_type(db, project, create_user):
    """Create and return an issue type instance"""
    issue_type = IssueType.objects.create(
        name="Task1",
        workspace=project.workspace,
        created_by=create_user,
    )

    ProjectIssueType.objects.create(
        project=project,
        issue_type=issue_type,
        created_by=create_user,
    )

    return issue_type


@pytest.fixture
def issue_property_text(db, project, create_user, issue_type):
    """Create and return an issue property instance"""

    property_obj = IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property1",
        property_type=PropertyTypeEnum.TEXT,
        logo_props={
            "in_use": "icon",
            "icon": {"name": "AlignLeft", "color": "#6d7b8a"},
        },
        created_by=create_user,
    )
    return property_obj


@pytest.fixture
def issue_property_option(db, project, create_user, issue_type):
    """Create and return an issue property option with two options"""
    property_obj = IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property2",
        property_type=PropertyTypeEnum.OPTION,
        logo_props={},
    )

    return property_obj


@pytest.fixture
def property_option_choice(db, project, create_user, issue_property_option, workspace):
    """Create and return an issue property instance"""
    option1 = IssuePropertyOption.objects.create(
        name="Test Option",
        property=issue_property_option,
        workspace=workspace,
        project=project,
        created_by=create_user,
    )

    return option1


@pytest.fixture
def issue_property_relation(db, project, create_user, issue_type):
    """Create and return an issue property instance"""
    property_obj = IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property3",
        property_type=PropertyTypeEnum.RELATION,
    )

    return property_obj


@pytest.fixture
def issue_property_datetime(db, project, create_user, issue_type):
    """Create and return an issue property instance"""
    property_obj = IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property4",
        property_type=PropertyTypeEnum.DATETIME,
    )

    return property_obj


@pytest.fixture
def issue_property_url(db, project, create_user, issue_type):
    """Create and return an issue property instance"""
    property_obj = IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property5",
        property_type=PropertyTypeEnum.URL,
    )

    return property_obj


@pytest.fixture
def issue_property_boolean(db, project, create_user, issue_type):
    """Create and return an issue property instance"""
    property_obj = IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property6",
        property_type=PropertyTypeEnum.BOOLEAN,
    )

    return property_obj


@pytest.fixture
def issue_property_decimal(db, project, create_user, issue_type):
    """Create and return an issue property instance"""
    property_obj = IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property7",
        property_type=PropertyTypeEnum.DECIMAL,
    )
    return property_obj


@pytest.fixture
def workitem_template(
    db,
    project_template,
    create_user,
    workspace,
    state_map,
    labels,
    issue_type,
    issue_property_text,
    issue_property_option,
    property_option_choice,
):
    """Create and return a workitem template instance"""

    workitem_template = WorkitemTemplate.objects.create(
        project_template=project_template,
        name="Test Workitem",
        description={"type": "doc", "content": [{"type": "paragraph"}]},
        description_html="<p>Test workitem description</p>",
        description_stripped="Test workitem description",
        priority="medium",
        state=template_states()[1],
        assignees=[str(create_user.id)],
        labels=template_labels(),
        type=template_workitem_types()[0],
        properties=[
            {
                "id": str(issue_property_text.id),
                "values": ["Test value"],
            },
            {
                "id": str(issue_property_option.id),
                "values": [
                    str(property_option_choice.id),
                ],
            },
        ],
        created_by=create_user,
        workspace=workspace,
    )
    return workitem_template


@pytest.fixture
def sub_workitem_template(
    db,
    workitem_template,
    create_user,
    workspace,
    state_map,
    labels,
    issue_type,
    issue_property_text,
):
    """Create and return a sub workitem template instance"""

    state_id = next(iter(state_map))

    template = WorkitemTemplate.objects.create(
        parent_workitem_template=workitem_template,
        name="Sub Workitem",
        description={"type": "doc", "content": [{"type": "paragraph"}]},
        description_html="<p>Sub workitem description</p>",
        description_stripped="Sub workitem description",
        priority="low",
        state={"id": state_map[state_id]},
        assignees=[{"id": str(create_user.id)}],
        labels=[{"id": str(label.id), "name": label.name} for label in labels],
        type={"id": str(issue_type.id), "name": issue_type.name},
        properties=[
            {
                "id": str(issue_property_text.id),
                "values": ["Sub value"],
            },
        ],
        created_by=create_user,
        workspace=workspace,
    )
    return template


@pytest.mark.unit
class TestCreateProjectFromTemplate:
    """Test cases for create_project_from_template function"""

    @pytest.mark.django_db
    def test_create_project_from_template_success(
        self,
        project_template,
        project,
        create_user,
        state_map,
    ):
        """Test successful project creation from template with all components"""
        # Arrange
        template_id = str(project_template.template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Act
        create_project_from_template(template_id, project_id, user_id, state_map)

        # Assert
        # Check estimates were created
        assert Estimate.objects.filter(project=project).exists()
        estimate = Estimate.objects.get(project=project)
        assert estimate.name == "Story Points"
        assert estimate.type == "categories"
        assert EstimatePoint.objects.filter(estimate=estimate).count() == 3

        # Check labels were created
        assert Label.objects.filter(project=project).count() == 2
        label_names = list(
            Label.objects.filter(project=project).values_list("name", flat=True)
        )
        assert "Bug" in label_names
        assert "Feature" in label_names

        # Check workitem types were created
        assert IssueType.objects.filter(workspace=project.workspace).exists()
        issue_type = IssueType.objects.get(workspace=project.workspace, name="Task")
        assert ProjectIssueType.objects.filter(
            project=project, issue_type=issue_type
        ).exists()

        # Check epic was created
        epic_type = IssueType.objects.filter(
            workspace=project.workspace, is_epic=True
        ).first()
        assert epic_type is not None
        assert epic_type.name == "Epic"

    @pytest.mark.django_db
    def test_create_project_from_template_without_estimates(
        self,
        project_template,
        project,
        create_user,
        state_map,
    ):
        """Test project creation from template without estimates"""
        # Arrange
        project_template.estimates = {}
        project_template.save()

        template_id = str(project_template.template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Act
        create_project_from_template(template_id, project_id, user_id, state_map)

        # Assert
        assert not Estimate.objects.filter(project=project).exists()

    @pytest.mark.django_db
    def test_create_project_from_template_without_labels(
        self,
        project_template,
        project,
        create_user,
        state_map,
    ):
        """Test project creation from template without labels"""
        # Arrange
        project_template.labels = {}
        project_template.save()

        template_id = str(project_template.template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Act
        create_project_from_template(template_id, project_id, user_id, state_map)

        # Assert
        assert not Label.objects.filter(project=project).exists()

    @pytest.mark.django_db
    def test_create_project_from_template_without_workitem_types(
        self,
        project_template,
        project,
        create_user,
        state_map,
    ):
        """Test project creation from template without workitem types"""
        # Arrange
        project_template.workitem_types = {}
        project_template.save()

        template_id = str(project_template.template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Act
        create_project_from_template(template_id, project_id, user_id, state_map)

        # Assert
        assert ProjectIssueType.objects.filter(project=project).exists() <= 1

    @pytest.mark.django_db
    def test_create_project_from_template_without_epics(
        self,
        project_template,
        project,
        create_user,
        state_map,
    ):
        """Test project creation from template without epics"""
        # Arrange
        project_template.epics = {}
        project_template.save()

        template_id = str(project_template.template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Act
        create_project_from_template(template_id, project_id, user_id, state_map)

        # Assert
        assert not IssueType.objects.filter(
            workspace=project.workspace, is_epic=True
        ).exists()

    @pytest.mark.django_db
    def test_create_project_from_template_with_workitem_blueprints(
        self,
        project_template,
        project,
        workitem_template,
        create_user,
        state_map,
        template_project,
    ):
        """Test project creation from template with workitem blueprints"""
        # Arrange
        template_id = str(project_template.template_id)
        project_id = str(template_project.id)
        user_id = str(create_user.id)

        # Act
        create_project_from_template(template_id, project_id, user_id, state_map)

        # Assert
        # Check workitem was created
        assert Issue.objects.filter(
            project_id=project_id, name=workitem_template.name
        ).exists()
        issue = Issue.objects.get(project_id=project_id, name=workitem_template.name)
        assert issue.description_stripped == workitem_template.description_stripped
        assert issue.priority == workitem_template.priority

        # Check issue sequence was created
        assert IssueSequence.objects.filter(issue=issue).exists()

        # Check issue activity was created
        assert IssueActivity.objects.filter(issue=issue).exists()

    @pytest.mark.django_db
    @patch("plane.ee.bgtasks.template_task.logger")
    def test_create_project_from_template_logging(
        self,
        mock_logger,
        project_template,
        project,
        create_user,
        state_map,
    ):
        """Test that appropriate logging occurs during project creation"""
        # Arrange
        template_id = str(project_template.template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Act
        create_project_from_template(template_id, project_id, user_id, state_map)

        # Assert
        # Verify that logging occurred for key steps
        mock_logger.info.assert_called()


@pytest.mark.unit
class TestCreateSubworkitems:
    """Test cases for create_subworkitems function"""

    @pytest.mark.django_db
    def test_create_subworkitems_success(
        self,
        workitem_template,
        sub_workitem_template,
        project,
        create_user,
    ):
        """Test successful subworkitem creation"""
        # Arrange
        workitem_template_id = str(workitem_template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        parent_issue = Issue.objects.create(
            project=project,
            name="Parent Issue",
            created_by=create_user,
        )

        # Act
        create_subworkitems(
            workitem_template_id, project_id, str(parent_issue.id), user_id
        )

        # Assert
        # Check subworkitem was created
        assert Issue.objects.filter(
            project=project, name=sub_workitem_template.name, parent=parent_issue
        ).exists()

        sub_issue = Issue.objects.get(
            project=project, name=sub_workitem_template.name, parent=parent_issue
        )
        assert (
            sub_issue.description_stripped == sub_workitem_template.description_stripped
        )
        assert sub_issue.priority == sub_workitem_template.priority
        assert str(sub_issue.state_id) == sub_workitem_template.state["id"]
        assert str(sub_issue.type_id) == sub_workitem_template.type["id"]

        # Check issue sequence was created
        assert IssueSequence.objects.filter(issue=sub_issue).exists()

        # Check issue activity was created
        assert IssueActivity.objects.filter(issue=sub_issue).exists()

    @pytest.mark.django_db
    def test_create_subworkitems_with_assignees(
        self,
        workitem_template,
        sub_workitem_template,
        project,
        create_user,
    ):
        """Test subworkitem creation with assignees"""
        # Arrange
        workitem_template_id = str(workitem_template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Create parent workitem
        parent_issue = Issue.objects.create(
            project=project,
            name="Parent Issue",
            created_by=create_user,
        )

        # Act
        create_subworkitems(
            workitem_template_id, project_id, str(parent_issue.id), user_id
        )

        # Assert
        sub_issue = Issue.objects.get(
            project=project, name=sub_workitem_template.name, parent=parent_issue
        )
        assert IssueAssignee.objects.filter(issue=sub_issue).exists()

    @pytest.mark.django_db
    def test_create_subworkitems_with_labels(
        self,
        workitem_template,
        sub_workitem_template,
        project,
        create_user,
        labels,
    ):
        """Test subworkitem creation with labels"""
        # Arrange
        workitem_template_id = str(workitem_template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Create parent workitem
        parent_issue = Issue.objects.create(
            project=project,
            name="Parent Issue",
            created_by=create_user,
        )

        # Act
        create_subworkitems(
            workitem_template_id, project_id, str(parent_issue.id), user_id
        )

        # Assert
        sub_issue = Issue.objects.get(
            project=project, name=sub_workitem_template.name, parent=parent_issue
        )
        assert IssueLabel.objects.filter(issue=sub_issue, label=labels[0].id).exists()

    @pytest.mark.django_db
    def test_create_subworkitems_with_properties(
        self,
        workitem_template,
        sub_workitem_template,
        project,
        create_user,
        issue_property_text,
    ):
        """Test subworkitem creation with properties"""
        # Arrange
        workitem_template_id = str(workitem_template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Create parent workitem
        parent_issue = Issue.objects.create(
            project=project,
            name="Parent Issue",
            created_by=create_user,
        )

        # Act
        create_subworkitems(
            workitem_template_id, project_id, str(parent_issue.id), user_id
        )

        # Assert
        sub_issue = Issue.objects.get(
            project=project, name=sub_workitem_template.name, parent=parent_issue
        )
        assert IssuePropertyValue.objects.filter(
            issue=sub_issue, property=issue_property_text
        ).exists()

    @pytest.mark.django_db
    def test_create_subworkitems_template_not_found(
        self,
        project,
        create_user,
    ):
        """Test subworkitem creation with non-existent template"""
        # Arrange
        workitem_template_id = str(uuid4())
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Create parent workitem
        parent_issue = Issue.objects.create(
            project=project,
            name="Parent Issue",
            created_by=create_user,
        )

        # Act
        create_subworkitems(
            workitem_template_id, project_id, str(parent_issue.id), user_id
        )

        # Assert
        # Should not create any issues
        assert Issue.objects.count() == 1  # Only the parent issue

    @pytest.mark.django_db
    def test_create_subworkitems_no_sub_templates(
        self,
        workitem_template,
        project,
        create_user,
    ):
        """Test subworkitem creation when no sub templates exist"""
        # Arrange
        workitem_template_id = str(workitem_template.id)
        project_id = str(project.id)
        user_id = str(create_user.id)

        # Create parent workitem
        parent_issue = Issue.objects.create(
            project=project,
            name="Parent Issue",
            created_by=create_user,
        )

        # Act
        create_subworkitems(
            workitem_template_id, project_id, str(parent_issue.id), user_id
        )

        # Assert
        # Should not create any new issues
        assert Issue.objects.count() == 1  # Only the parent issue


@pytest.mark.unit
class TestHelperFunctions:
    """Test cases for helper functions"""

    def test_get_random_color(self):
        """Test random color generation"""
        color = get_random_color()
        assert color.startswith("#")
        assert len(color) == 7  # #RRGGBB format
        # Verify it's a valid hex color
        int(color[1:], 16)  # Should not raise ValueError

    def test_parse_datetime_value_valid_formats(self):
        """Test datetime parsing with valid formats"""
        # Test various valid datetime formats
        test_cases = [
            ("2023-01-15", datetime(2023, 1, 15)),
            ("2023-01-15 14:30:00", datetime(2023, 1, 15, 14, 30, 0)),
            ("2023-01-15T14:30:00", datetime(2023, 1, 15, 14, 30, 0)),
            ("2023-01-15T14:30:00.123Z", datetime(2023, 1, 15, 14, 30, 0, 123000)),
        ]

        for input_str, expected in test_cases:
            result = _parse_datetime_value(input_str)
            assert result == expected

    def test_parse_datetime_value_invalid_format(self):
        """Test datetime parsing with invalid format"""
        result = _parse_datetime_value("invalid-date")
        assert result is None

    def test_parse_datetime_value_non_string(self):
        """Test datetime parsing with non-string input"""
        dt = datetime.now()
        result = _parse_datetime_value(dt)
        assert result == dt

    def test_parse_datetime_value_none(self):
        """Test datetime parsing with None input"""
        result = _parse_datetime_value(None)
        assert result is None

    @pytest.mark.django_db
    def test_get_property_value_data_text(self, issue_property_text):
        """Test property value data generation for text type"""
        value = "Test text value"
        result = _get_property_value_data(issue_property_text, value)
        assert result == {"value_text": "Test text value"}

    @pytest.mark.django_db
    def test_get_property_value_data_boolean(self, issue_property_boolean):
        """Test property value data generation for boolean type"""
        issue_property_boolean.property_type = PropertyTypeEnum.BOOLEAN
        issue_property_boolean.save()

        # Test True
        result = _get_property_value_data(issue_property_boolean, True)
        assert result == {"value_boolean": True}

        # Test False
        result = _get_property_value_data(issue_property_boolean, False)
        assert result == {"value_boolean": False}

    @pytest.mark.django_db
    def test_get_property_value_data_decimal(self, issue_property_decimal):
        """Test property value data generation for decimal type"""
        issue_property_decimal.property_type = PropertyTypeEnum.DECIMAL
        issue_property_decimal.save()

        result = _get_property_value_data(issue_property_decimal, 42.5)
        assert result == {"value_decimal": 42.5}

    @pytest.mark.django_db
    def test_get_property_value_data_datetime(self, issue_property_datetime):
        """Test property value data generation for datetime type"""
        issue_property_datetime.property_type = PropertyTypeEnum.DATETIME
        issue_property_datetime.save()

        dt = datetime(2023, 1, 15, 14, 30, 0)
        result = _get_property_value_data(issue_property_datetime, dt)
        assert result == {"value_datetime": dt}

    @pytest.mark.django_db
    def test_get_property_value_data_option(
        self, issue_property_option, property_option_choice
    ):
        """Test property value data generation for option type"""
        issue_property_option.property_type = PropertyTypeEnum.OPTION
        issue_property_option.save()

        result = _get_property_value_data(
            issue_property_option, str(property_option_choice.id)
        )
        assert result == {"value_option": property_option_choice}

    @pytest.mark.django_db
    def test_get_property_value_data_option_with_mapping(
        self, issue_property_option, property_option_choice
    ):
        """Test property value data generation for option type with mapping"""
        issue_property_option.property_type = PropertyTypeEnum.OPTION
        issue_property_option.save()

        # Create a mapping from old option ID to new option ID
        old_option_id = str(uuid4())
        mapping = {old_option_id: str(property_option_choice.id)}

        result = _get_property_value_data(issue_property_option, old_option_id, mapping)
        assert result == {"value_option": property_option_choice}

    @pytest.mark.django_db
    def test_get_property_value_data_option_invalid_id(self, issue_property_option):
        """Test property value data generation for option type with invalid ID"""
        issue_property_option.property_type = PropertyTypeEnum.OPTION
        issue_property_option.save()

        result = _get_property_value_data(issue_property_option, str(uuid4()))
        assert result is None

    @pytest.mark.django_db
    def test_get_property_value_data_relation(self, issue_property_relation):
        """Test property value data generation for relation type"""
        issue_property_relation.property_type = PropertyTypeEnum.RELATION
        issue_property_relation.save()

        relation_id = str(uuid4())
        result = _get_property_value_data(issue_property_relation, relation_id)
        assert result == {"value_uuid": uuid.UUID(relation_id)}

    @pytest.mark.django_db
    def test_get_property_value_data_unknown_type(self, issue_property_text):
        """Test property value data generation for unknown type"""
        issue_property_text.property_type = "UNKNOWN_TYPE"
        issue_property_text.save()

        value = "test value"
        result = _get_property_value_data(issue_property_text, value)
        assert result == {"value_text": "test value"}

    @pytest.mark.django_db
    def test_get_property_value_data_invalid_value(self, issue_property_decimal):
        """Test property value data generation with invalid value"""
        issue_property_decimal.property_type = PropertyTypeEnum.DECIMAL
        issue_property_decimal.save()

        # Test with non-numeric string
        result = _get_property_value_data(issue_property_decimal, "not-a-number")
        assert result is None


@pytest.mark.unit
class TestIndividualFunctions:
    """Test cases for individual helper functions"""

    @pytest.mark.django_db
    def test_create_estimates(self, project, create_user):
        """Test estimate creation"""
        estimate_data = {
            "name": "Story Points",
            "type": "fibonacci",
            "points": [
                {"id": str(uuid4()), "key": "0", "value": 0},
                {"id": str(uuid4()), "key": "1", "value": 1},
            ],
        }

        result = create_estimates(
            estimate_data, str(project.id), project, str(create_user.id)
        )

        assert Estimate.objects.filter(project=project).exists()
        estimate = Estimate.objects.get(project=project)
        assert estimate.name == "Story Points"
        assert estimate.type == "fibonacci"
        assert EstimatePoint.objects.filter(estimate=estimate).count() == 2
        assert len(result) == 2  # Should return mapping of old to new IDs

    @pytest.mark.django_db
    def test_create_labels(self, project, create_user):
        """Test label creation"""
        label_data = [
            {"id": str(uuid4()), "name": "Bug", "color": "#ff0000"},
            {"id": str(uuid4()), "name": "Feature", "color": "#00ff00"},
        ]

        result = create_labels(
            label_data, str(project.id), str(project.workspace.id), str(create_user.id)
        )

        assert Label.objects.filter(project=project).count() == 2
        label_names = list(
            Label.objects.filter(project=project).values_list("name", flat=True)
        )
        assert "Bug" in label_names
        assert "Feature" in label_names
        assert len(result) == 2  # Should return mapping of old to new IDs

    @pytest.mark.django_db
    def test_create_workitem_types(self, project, create_user):
        """Test workitem type creation"""
        workitem_type_data = [
            {
                "id": str(uuid4()),
                "name": "Task",
                "description": "A task",
                "is_default": True,
                "logo_props": {},
                "properties": [
                    {
                        "id": str(uuid4()),
                        "display_name": "Priority",
                        "property_type": PropertyTypeEnum.TEXT,
                        "logo_props": {},
                        "is_required": False,
                        "settings": {},
                        "is_active": True,
                        "is_multi": False,
                    }
                ],
            }
        ]

        result = create_workitem_types(
            workitem_type_data,
            str(project.id),
            str(project.workspace.id),
            str(create_user.id),
        )

        workitem_type_map, workitem_property_map, workitem_property_option_map = result

        assert IssueType.objects.filter(workspace=project.workspace).exists()
        issue_type = IssueType.objects.get(workspace=project.workspace, name="Task")
        assert ProjectIssueType.objects.filter(
            project=project, issue_type=issue_type
        ).exists()
        assert IssueProperty.objects.filter(issue_type=issue_type).exists()

        assert len(workitem_type_map) == 1
        assert len(workitem_property_map) == 1
        assert len(workitem_property_option_map) == 0

    @pytest.mark.django_db
    def test_create_epics(self, project, create_user):
        """Test epic creation"""
        epic_data = {
            "name": "Epic",
            "description": "Epic workitem type",
            "properties": [
                {
                    "display_name": "Epic Property",
                    "property_type": PropertyTypeEnum.TEXT,
                    "logo_props": {},
                    "is_required": False,
                    "settings": {},
                    "is_active": True,
                    "is_multi": False,
                }
            ],
        }

        create_epics(
            epic_data, str(project.id), str(project.workspace.id), str(create_user.id)
        )

        epic_type = IssueType.objects.filter(
            workspace=project.workspace, is_epic=True
        ).first()
        assert epic_type is not None
        assert epic_type.name == "Epic"
        assert ProjectIssueType.objects.filter(
            project=project, issue_type=epic_type
        ).exists()
        assert IssueProperty.objects.filter(issue_type=epic_type).exists()

    @pytest.mark.django_db
    def test_create_issue_property_values(
        self, project, create_user, issue_property_text
    ):
        """Test issue property value creation"""
        # Create an issue
        issue = Issue.objects.create(
            project=project,
            name="Test Issue",
            created_by=create_user,
        )

        blueprint_properties = [
            {"id": str(issue_property_text.id), "values": ["Test value"]}
        ]

        workitem_property_map = {
            str(issue_property_text.id): str(issue_property_text.id)
        }
        workitem_property_option_map = {}

        create_issue_property_values(
            issue,
            blueprint_properties,
            workitem_property_map,
            workitem_property_option_map,
            str(project.workspace.id),
            str(project.id),
            str(create_user.id),
        )

        assert IssuePropertyValue.objects.filter(
            issue=issue, property=issue_property_text
        ).exists()
        property_value = IssuePropertyValue.objects.get(
            issue=issue, property=issue_property_text
        )
        assert property_value.value_text == "Test value"
