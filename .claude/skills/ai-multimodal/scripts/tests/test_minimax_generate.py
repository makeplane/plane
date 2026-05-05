"""
Tests for minimax_generate.py - generation functions for image, video, speech, music.
"""

import json
import pytest
import sys
import time
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock, call

sys.path.insert(0, str(Path(__file__).parent.parent))

import minimax_generate as mg


class TestModelRegistries:
    """Test model set definitions."""

    def test_image_models(self):
        assert 'image-01' in mg.MINIMAX_IMAGE_MODELS
        assert 'image-01-live' in mg.MINIMAX_IMAGE_MODELS

    def test_video_models(self):
        assert 'MiniMax-Hailuo-2.3' in mg.MINIMAX_VIDEO_MODELS
        assert 'MiniMax-Hailuo-2.3-Fast' in mg.MINIMAX_VIDEO_MODELS
        assert 'S2V-01' in mg.MINIMAX_VIDEO_MODELS

    def test_speech_models(self):
        assert 'speech-2.8-hd' in mg.MINIMAX_SPEECH_MODELS
        assert 'speech-2.8-turbo' in mg.MINIMAX_SPEECH_MODELS

    def test_music_models(self):
        assert 'music-2.5' in mg.MINIMAX_MUSIC_MODELS

    def test_all_models_is_union(self):
        expected = (mg.MINIMAX_IMAGE_MODELS | mg.MINIMAX_VIDEO_MODELS |
                    mg.MINIMAX_SPEECH_MODELS | mg.MINIMAX_MUSIC_MODELS)
        assert mg.ALL_MINIMAX_MODELS == expected


class TestIsMinimaxModel:
    """Test model detection."""

    def test_known_image_model(self):
        assert mg.is_minimax_model('image-01') is True

    def test_known_video_model(self):
        assert mg.is_minimax_model('MiniMax-Hailuo-2.3') is True

    def test_known_speech_model(self):
        assert mg.is_minimax_model('speech-2.8-hd') is True

    def test_known_music_model(self):
        assert mg.is_minimax_model('music-2.5') is True

    def test_prefix_minimax(self):
        assert mg.is_minimax_model('MiniMax-Future-Model') is True

    def test_prefix_speech(self):
        assert mg.is_minimax_model('speech-3.0-ultra') is True

    def test_prefix_s2v(self):
        assert mg.is_minimax_model('S2V-02') is True

    def test_non_minimax_model(self):
        assert mg.is_minimax_model('gemini-2.5-flash') is False

    def test_non_minimax_imagen(self):
        assert mg.is_minimax_model('imagen-4.0-generate-001') is False


class TestGenerateImage:
    """Test image generation."""

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_success(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {
            "data": {"image_urls": ["https://cdn.minimax.io/img1.png"]}
        }

        with patch('requests.get') as mock_req_get:
            mock_resp = Mock()
            mock_resp.content = b'\x89PNG\r\n\x1a\n'
            mock_resp.raise_for_status = Mock()
            mock_req_get.return_value = mock_resp

            result = mg.generate_image("key", "A cat", "image-01")

        assert result["status"] == "success"
        assert len(result["generated_images"]) == 1
        assert result["model"] == "image-01"

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_no_images_returns_error(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {"data": {"image_urls": []}}

        result = mg.generate_image("key", "A cat", "image-01")
        assert result["status"] == "error"

    @patch('minimax_generate.api_post')
    def test_payload_structure(self, mock_post):
        mock_post.return_value = {"data": {"image_urls": []}}

        mg.generate_image("key", "A dog", "image-01", "16:9", 3)

        payload = mock_post.call_args[0][1]
        assert payload["model"] == "image-01"
        assert payload["prompt"] == "A dog"
        assert payload["aspect_ratio"] == "16:9"
        assert payload["n"] == 3
        assert payload["response_format"] == "url"
        assert payload["prompt_optimizer"] is True

    @patch('minimax_generate.api_post')
    def test_num_images_capped_at_9(self, mock_post):
        mock_post.return_value = {"data": {"image_urls": []}}

        mg.generate_image("key", "test", "image-01", num_images=15)

        payload = mock_post.call_args[0][1]
        assert payload["n"] == 9

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_output_copy(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {
            "data": {"image_urls": ["https://cdn.minimax.io/img.png"]}
        }

        with patch('requests.get') as mock_req_get:
            mock_resp = Mock()
            mock_resp.content = b'image_bytes'
            mock_resp.raise_for_status = Mock()
            mock_req_get.return_value = mock_resp

            output_path = str(tmp_path / "custom_output.png")
            result = mg.generate_image("key", "test", output=output_path)

        assert Path(output_path).exists()


class TestGenerateVideo:
    """Test video generation (async workflow)."""

    @patch('minimax_generate.download_file')
    @patch('minimax_generate.poll_async_task')
    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_success(self, mock_post, mock_dir, mock_poll, mock_dl, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {"task_id": "vid-task-123"}
        mock_poll.return_value = {"file_id": "file-456"}
        # Create a fake video file so stat() works
        mock_dl.side_effect = lambda fid, key, path, v: (
            Path(path).write_bytes(b'fake_video') or path
        )

        result = mg.generate_video("key", "A dancer")

        assert result["status"] == "success"
        assert "generated_video" in result
        assert result["model"] == "MiniMax-Hailuo-2.3"
        mock_poll.assert_called_once()

    @patch('minimax_generate.api_post')
    def test_no_task_id_error(self, mock_post):
        mock_post.return_value = {"error": "bad request"}

        result = mg.generate_video("key", "test")
        assert result["status"] == "error"
        assert "No task_id" in result["error"]

    @patch('minimax_generate.poll_async_task')
    @patch('minimax_generate.api_post')
    def test_no_file_id_error(self, mock_post, mock_poll):
        mock_post.return_value = {"task_id": "t1"}
        mock_poll.return_value = {"status": "Success"}

        result = mg.generate_video("key", "test")
        assert result["status"] == "error"
        assert "No file_id" in result["error"]

    @patch('minimax_generate.api_post')
    def test_payload_with_first_frame(self, mock_post):
        mock_post.return_value = {"task_id": None}

        mg.generate_video("key", "test", first_frame="https://img.url/frame.png")

        payload = mock_post.call_args[0][1]
        assert payload["first_frame_image"] == "https://img.url/frame.png"

    @patch('minimax_generate.api_post')
    def test_payload_duration_resolution(self, mock_post):
        mock_post.return_value = {"task_id": None}

        mg.generate_video("key", "test", duration=10, resolution="720P")

        payload = mock_post.call_args[0][1]
        assert payload["duration"] == 10
        assert payload["resolution"] == "720P"


class TestGenerateSpeech:
    """Test speech/TTS generation."""

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_success(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        # hex-encoded audio bytes
        mock_post.return_value = {
            "data": {"audio": "48656c6c6f"}  # "Hello" in hex
        }

        result = mg.generate_speech("key", "Hello world")

        assert result["status"] == "success"
        assert "generated_audio" in result
        assert result["model"] == "speech-2.8-hd"
        # Verify file was written
        audio_path = Path(result["generated_audio"])
        assert audio_path.exists()
        assert audio_path.read_bytes() == bytes.fromhex("48656c6c6f")

    @patch('minimax_generate.api_post')
    def test_no_audio_returns_error(self, mock_post):
        mock_post.return_value = {"data": {}}

        result = mg.generate_speech("key", "test")
        assert result["status"] == "error"

    @patch('minimax_generate.api_post')
    def test_payload_structure(self, mock_post):
        mock_post.return_value = {"data": {}}

        mg.generate_speech("key", "Test text", "speech-2.8-turbo",
                           voice="English_Warm_Bestie", emotion="happy",
                           output_format="wav", rate=1.5)

        payload = mock_post.call_args[0][1]
        assert payload["model"] == "speech-2.8-turbo"
        assert payload["text"] == "Test text"
        assert payload["stream"] is False
        assert payload["output_format"] == "hex"
        assert payload["voice_setting"]["voice_id"] == "English_Warm_Bestie"
        assert payload["voice_setting"]["speed"] == 1.5
        assert payload["audio_setting"]["format"] == "wav"
        assert payload["audio_setting"]["sample_rate"] == 32000

    @patch('minimax_generate.api_post')
    def test_text_truncated_at_10000(self, mock_post):
        mock_post.return_value = {"data": {}}
        long_text = "x" * 15000

        mg.generate_speech("key", long_text)

        payload = mock_post.call_args[0][1]
        assert len(payload["text"]) == 10000

    @patch('minimax_generate.api_post')
    def test_uses_t2a_v2_endpoint(self, mock_post):
        mock_post.return_value = {"data": {}}

        mg.generate_speech("key", "test")

        endpoint = mock_post.call_args[0][0]
        assert endpoint == "t2a_v2"

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_wav_extension(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {"data": {"audio": "aabb"}}

        result = mg.generate_speech("key", "test", output_format="wav")
        assert result["generated_audio"].endswith(".wav")

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_pcm_defaults_to_mp3_ext(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {"data": {"audio": "aabb"}}

        result = mg.generate_speech("key", "test", output_format="pcm")
        assert result["generated_audio"].endswith(".mp3")


class TestGenerateMusic:
    """Test music generation."""

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_success_with_url(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {
            "data": {"audio": "https://cdn.minimax.io/music.mp3"},
            "extra_info": {"music_duration": 120000}
        }

        with patch('requests.get') as mock_req_get:
            mock_resp = Mock()
            mock_resp.content = b'music_data'
            mock_resp.raise_for_status = Mock()
            mock_req_get.return_value = mock_resp

            result = mg.generate_music("key", lyrics="La la la",
                                        prompt="pop")

        assert result["status"] == "success"
        assert result["duration_ms"] == 120000
        assert result["model"] == "music-2.5"

    @patch('minimax_generate.get_output_dir')
    @patch('minimax_generate.api_post')
    def test_success_with_hex(self, mock_post, mock_dir, tmp_path):
        mock_dir.return_value = tmp_path
        mock_post.return_value = {
            "data": {"audio": "deadbeef"},
            "extra_info": {"music_duration": 60000}
        }

        result = mg.generate_music("key", lyrics="test")

        assert result["status"] == "success"
        audio_path = Path(result["generated_audio"])
        assert audio_path.read_bytes() == bytes.fromhex("deadbeef")

    @patch('minimax_generate.api_post')
    def test_no_audio_returns_error(self, mock_post):
        mock_post.return_value = {"data": {}, "extra_info": {}}

        result = mg.generate_music("key", lyrics="test")
        assert result["status"] == "error"

    @patch('minimax_generate.api_post')
    def test_payload_structure(self, mock_post):
        mock_post.return_value = {"data": {}, "extra_info": {}}

        mg.generate_music("key", lyrics="Verse 1\nHello",
                          prompt="upbeat pop", model="music-2.5",
                          output_format="wav")

        payload = mock_post.call_args[0][1]
        assert payload["model"] == "music-2.5"
        assert payload["lyrics"] == "Verse 1\nHello"
        assert payload["prompt"] == "upbeat pop"
        assert payload["output_format"] == "url"
        assert payload["audio_setting"]["format"] == "wav"
        assert payload["audio_setting"]["sample_rate"] == 44100

    @patch('minimax_generate.api_post')
    def test_lyrics_truncated_at_3500(self, mock_post):
        mock_post.return_value = {"data": {}, "extra_info": {}}

        mg.generate_music("key", lyrics="x" * 5000)

        payload = mock_post.call_args[0][1]
        assert len(payload["lyrics"]) == 3500

    @patch('minimax_generate.api_post')
    def test_prompt_truncated_at_2000(self, mock_post):
        mock_post.return_value = {"data": {}, "extra_info": {}}

        mg.generate_music("key", prompt="y" * 3000)

        payload = mock_post.call_args[0][1]
        assert len(payload["prompt"]) == 2000

    @patch('minimax_generate.api_post')
    def test_uses_300s_timeout(self, mock_post):
        mock_post.return_value = {"data": {}, "extra_info": {}}

        mg.generate_music("key", lyrics="test")

        # Check timeout kwarg passed to api_post
        _, kwargs = mock_post.call_args
        assert kwargs.get('timeout') == 300

    @patch('minimax_generate.api_post')
    def test_empty_lyrics_omitted(self, mock_post):
        mock_post.return_value = {"data": {}, "extra_info": {}}

        mg.generate_music("key", lyrics="", prompt="jazz")

        payload = mock_post.call_args[0][1]
        assert "lyrics" not in payload
        assert payload["prompt"] == "jazz"
