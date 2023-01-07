# All the python scripts that are used for back migrations

from plane.db.models import Issue

# Update description and description html values for old descriptions
def update_description():
    try:

        issues = Issue.objects.all()
        updated_issues = []

        for issue in issues:
            issue.description_html = f"<p>{issue.description}</p>"
            issue.description_stripped = issue.description
            updated_issues.append(issue)

        Issue.objects.bulk_update(
            updated_issues, ["description_html", "description_stripped"], batch_size=100
        )
        print("Success")
    except Exception as e:
        print(e)
        print("Failed")