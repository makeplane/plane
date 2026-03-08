from django.test import TestCase
from plane.db.models import Sticky, Workspace

class StickyOrderTests(TestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")

    def test_default_sort_order_assignment(self):
        #Create the first sticky
        s1 = Sticky.objects.create(workspace=self.workspace, name="Sticky 1")
        self.assertEqual(s1.sort_order, 65535)

        #Create the second sticky
        s2 = Sticky.objects.create(workspace=self.workspace, name="Sticky 2")
        self.assertEqual(s2.sort_order, 131070)

    def test_api_returns_ordered_list(self):
        Sticky.objects.create(workspace=self.workspace, name="Last", sort_order=200)
        Sticky.objects.create(workspace=self.workspace, name="First", sort_order=100)

        res = self.client.get(f"/api/workspaces/{self.workspace.slug}/stickies/")
        results = res.data
        self.assertEqual(results[0]["name"], "First")
        self.assertEqual(results[1]["name"], "Last")