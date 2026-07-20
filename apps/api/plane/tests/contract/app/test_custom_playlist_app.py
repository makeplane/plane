import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import CustomPlaylist, Issue, Project, ProjectMember, User


class TestCustomPlaylistBase:
    def get_playlist_url(self, playlist_id: uuid.UUID | None = None) -> str:
        base_url = "/api/custom-playlists/"
        if playlist_id:
            return f"{base_url}{playlist_id}/"
        return base_url

    def create_project_event(self, workspace, user, name="Football Final Match"):
        project = Project.objects.create(name=f"{name} Project", identifier=uuid.uuid4().hex[:8], workspace=workspace)
        ProjectMember.objects.create(project=project, member=user, role=20, is_active=True)
        event = Issue.objects.create(project=project, name=name, sg_event_id=100000 + uuid.uuid4().int % 900000)
        return project, event

    def playlist_payload(self, event):
        return {
            "event_id": event.sg_event_id,
            "name": "Football Final Match",
            "url": "https://sports.kanavio.com/hls/final-match/master.m3u8",
            "thumbnail": "https://sports.kanavio.com/thumbnails/final-match.jpg",
            "clip": 12,
        }

    def project_playlist_payload(self, project, event_id=1313):
        return {
            "event_id": event_id,
            "project_id": str(project.id),
            "workspace_slug": project.workspace.slug,
            "name": "Media Library Event Playlist",
            "url": "https://sports.kanavio.com/hls/media-library-event/master.m3u8",
            "thumbnail": "https://sports.kanavio.com/thumbnails/media-library-event.jpg",
            "clip": 7,
        }


@pytest.mark.contract
class TestCustomPlaylistAPI(TestCustomPlaylistBase):
    @pytest.mark.django_db
    def test_create_playlist_successfully(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user)

        response = session_client.post(self.get_playlist_url(), self.playlist_payload(event), format="json")

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["event_id"] == event.sg_event_id
        assert data["name"] == "Football Final Match"
        assert data["url"] == "master.m3u8"
        assert data["thumbnail"] == "final-match.jpg"
        assert data["clip"] == 12
        assert CustomPlaylist.objects.filter(pk=data["id"], event_id=event.sg_event_id).exists()

    @pytest.mark.django_db
    def test_list_playlists_returns_only_accessible_events(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user)
        accessible_playlist = CustomPlaylist.objects.create(
            event_id=event.sg_event_id,
            name="Accessible Playlist",
            url="https://sports.kanavio.com/hls/accessible/master.m3u8",
        )

        hidden_project = Project.objects.create(name="Hidden Project", identifier="HIDE", workspace=workspace)
        hidden_event = Issue.objects.create(
            project=hidden_project,
            name="Hidden Event",
            sg_event_id=100000 + uuid.uuid4().int % 900000,
        )
        CustomPlaylist.objects.create(
            event_id=hidden_event.sg_event_id,
            name="Hidden Playlist",
            url="https://sports.kanavio.com/hls/hidden/master.m3u8",
        )

        response = session_client.get(self.get_playlist_url())

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert [playlist["id"] for playlist in data] == [str(accessible_playlist.id)]

    @pytest.mark.django_db
    def test_filter_playlists_by_event(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user, name="Event One")
        _, other_event = self.create_project_event(workspace, create_user, name="Event Two")
        playlist = CustomPlaylist.objects.create(
            event_id=event.sg_event_id,
            name="Event One Playlist",
            url="https://sports.kanavio.com/hls/event-one/master.m3u8",
        )
        CustomPlaylist.objects.create(
            event_id=other_event.sg_event_id,
            name="Event Two Playlist",
            url="https://sports.kanavio.com/hls/event-two/master.m3u8",
        )

        response = session_client.get(self.get_playlist_url(), {"event_id": event.sg_event_id})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(playlist.id)
        assert data[0]["event_id"] == event.sg_event_id

    @pytest.mark.django_db
    def test_create_playlist_with_project_context_when_event_issue_is_missing(
        self, session_client, workspace, create_user
    ):
        project = Project.objects.create(name="Media Library Project", identifier="MLIB", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        response = session_client.post(self.get_playlist_url(), self.project_playlist_payload(project), format="json")

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["event_id"] == 1313
        assert data["name"] == "Media Library Event Playlist"
        assert data["url"] == "master.m3u8"
        assert data["thumbnail"] == "media-library-event.jpg"
        assert data["clip"] == 7
        assert "project_id" not in data
        assert "workspace_slug" not in data

    @pytest.mark.django_db
    def test_filter_playlists_by_event_with_project_context_when_event_issue_is_missing(
        self, session_client, workspace, create_user
    ):
        project = Project.objects.create(name="Media Library Project", identifier="MLIB", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        playlist = CustomPlaylist.objects.create(
            event_id=1313,
            name="Media Library Event Playlist",
            url="master.m3u8",
            thumbnail="media-library-event.jpg",
            clip=7,
        )

        response = session_client.get(
            self.get_playlist_url(),
            {
                "event_id": 1313,
                "project_id": str(project.id),
                "workspace_slug": project.workspace.slug,
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(playlist.id)
        assert data[0]["event_id"] == 1313

    @pytest.mark.django_db
    def test_retrieve_playlist_successfully(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user)
        playlist = CustomPlaylist.objects.create(
            event_id=event.sg_event_id,
            name="Playlist",
            url="https://sports.kanavio.com/hls/playlist/master.m3u8",
        )

        response = session_client.get(self.get_playlist_url(playlist.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == str(playlist.id)

    @pytest.mark.django_db
    def test_update_playlist_successfully(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user)
        playlist = CustomPlaylist.objects.create(
            event_id=event.sg_event_id,
            name="Old Playlist",
            url="https://sports.kanavio.com/hls/old/master.m3u8",
        )

        response = session_client.patch(
            self.get_playlist_url(playlist.id),
            {"name": "Updated Playlist", "thumbnail": "", "clip": 3},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        playlist.refresh_from_db()
        assert playlist.name == "Updated Playlist"
        assert playlist.thumbnail is None
        assert playlist.clip == 3
        assert response.json()["thumbnail"] is None
        assert response.json()["clip"] == 3

    @pytest.mark.django_db
    def test_delete_playlist_successfully(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user)
        playlist = CustomPlaylist.objects.create(
            event_id=event.sg_event_id,
            name="Playlist",
            url="https://sports.kanavio.com/hls/playlist/master.m3u8",
        )

        response = session_client.delete(self.get_playlist_url(playlist.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not CustomPlaylist.objects.filter(pk=playlist.id).exists()

    @pytest.mark.django_db
    def test_create_playlist_rejects_invalid_input(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user)

        response = session_client.post(
            self.get_playlist_url(),
            {
                "event_id": event.sg_event_id,
                "name": " ",
                "url": "",
                "thumbnail": f"{'a' * 256}.jpg",
                "clip": -1,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "name" in data
        assert "url" in data
        assert "thumbnail" in data
        assert "clip" in data

    @pytest.mark.django_db
    def test_create_playlist_accepts_file_names(self, session_client, workspace, create_user):
        _, event = self.create_project_event(workspace, create_user)

        response = session_client.post(
            self.get_playlist_url(),
            {
                "event_id": event.sg_event_id,
                "name": "Filename Playlist",
                "url": "990ef30c.m3u8",
                "thumbnail": "gYOMnVLyxdWHQWFG.jpg",
                "clip": 1,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["url"] == "990ef30c.m3u8"
        assert data["thumbnail"] == "gYOMnVLyxdWHQWFG.jpg"

    @pytest.mark.django_db
    def test_create_playlist_returns_404_for_missing_event(self, session_client):
        response = session_client.post(
            self.get_playlist_url(),
            {
                "event_id": 999999999,
                "name": "Missing Event Playlist",
                "url": "https://sports.kanavio.com/hls/missing/master.m3u8",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_create_playlist_returns_403_for_inaccessible_event(self, workspace, create_user):
        other_user = User.objects.create(email="other-user@plane.so", first_name="Other", last_name="User")
        project, event = self.create_project_event(workspace, other_user)

        denied_user = create_user
        ProjectMember.objects.filter(project=project, member=denied_user).delete()
        client = APIClient()
        client.force_authenticate(user=denied_user)

        response = client.post(self.get_playlist_url(), self.playlist_payload(event), format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_retrieve_playlist_returns_403_for_inaccessible_event(self, workspace, create_user):
        other_user = User.objects.create(email="playlist-owner@plane.so", first_name="Owner", last_name="User")
        _, event = self.create_project_event(workspace, other_user)
        playlist = CustomPlaylist.objects.create(
            event_id=event.sg_event_id,
            name="Hidden Playlist",
            url="https://sports.kanavio.com/hls/hidden/master.m3u8",
        )

        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.get(self.get_playlist_url(playlist.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN
