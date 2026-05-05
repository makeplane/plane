"""
Tests for minimax_cli.py - CLI argument parsing and task dispatch.
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent))

import minimax_cli as cli


class TestTaskDefaults:
    """Test task-to-model default mapping."""

    def test_generate_defaults_to_image_01(self):
        assert cli.TASK_DEFAULTS['generate'] == 'image-01'

    def test_generate_video_defaults_to_hailuo(self):
        assert cli.TASK_DEFAULTS['generate-video'] == 'MiniMax-Hailuo-2.3'

    def test_generate_speech_defaults_to_speech_28_hd(self):
        assert cli.TASK_DEFAULTS['generate-speech'] == 'speech-2.8-hd'

    def test_generate_music_defaults_to_music_25(self):
        assert cli.TASK_DEFAULTS['generate-music'] == 'music-2.5'


class TestPrintResult:
    """Test result formatting."""

    def test_success_image(self, capsys):
        result = {
            "status": "success",
            "generated_images": ["/path/to/img.png"],
            "model": "image-01"
        }
        cli.print_result(result, "generate")
        output = capsys.readouterr().out
        assert "success" in output.lower()
        assert "/path/to/img.png" in output
        assert "image-01" in output

    def test_success_video(self, capsys):
        result = {
            "status": "success",
            "generated_video": "/path/to/vid.mp4",
            "generation_time": 45.2,
            "model": "MiniMax-Hailuo-2.3"
        }
        cli.print_result(result, "generate-video")
        output = capsys.readouterr().out
        assert "/path/to/vid.mp4" in output
        assert "45.2s" in output

    def test_success_audio(self, capsys):
        result = {
            "status": "success",
            "generated_audio": "/path/to/audio.mp3",
            "duration_ms": 140000,
            "model": "music-2.5"
        }
        cli.print_result(result, "generate-music")
        output = capsys.readouterr().out
        assert "/path/to/audio.mp3" in output
        assert "140.0s" in output

    def test_error_result(self, capsys):
        result = {"status": "error", "error": "Rate limit exceeded"}
        cli.print_result(result, "generate")
        output = capsys.readouterr().out
        assert "Rate limit exceeded" in output

    def test_unknown_status(self, capsys):
        result = {"model": "image-01"}
        cli.print_result(result, "generate")
        output = capsys.readouterr().out
        assert "unknown" in output.lower()


class TestMainCLI:
    """Test CLI main() argument parsing and dispatch."""

    @patch('minimax_cli.find_minimax_api_key', return_value=None)
    def test_no_api_key_exits(self, mock_key, capsys):
        with patch('sys.argv', ['cli', '--task', 'generate', '--prompt', 'x']):
            with pytest.raises(SystemExit) as exc_info:
                cli.main()
            assert exc_info.value.code == 1

    @patch('minimax_cli.generate_image')
    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_generate_image_dispatch(self, mock_key, mock_gen):
        mock_gen.return_value = {"status": "success", "generated_images": [],
                                  "model": "image-01"}
        with patch('sys.argv', ['cli', '--task', 'generate',
                                 '--prompt', 'A cat']):
            cli.main()
        mock_gen.assert_called_once()
        args = mock_gen.call_args
        assert args[0][0] == 'test-key'
        assert args[0][1] == 'A cat'

    @patch('minimax_cli.generate_speech')
    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_generate_speech_dispatch(self, mock_key, mock_gen):
        mock_gen.return_value = {"status": "success",
                                  "generated_audio": "/x.mp3",
                                  "model": "speech-2.8-hd"}
        with patch('sys.argv', ['cli', '--task', 'generate-speech',
                                 '--text', 'Hello world']):
            cli.main()
        mock_gen.assert_called_once()

    @patch('minimax_cli.generate_speech')
    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_speech_uses_text_or_prompt(self, mock_key, mock_gen):
        mock_gen.return_value = {"status": "success",
                                  "generated_audio": "/x.mp3",
                                  "model": "speech-2.8-hd"}
        # --prompt should work as fallback for --text
        with patch('sys.argv', ['cli', '--task', 'generate-speech',
                                 '--prompt', 'Fallback text']):
            cli.main()
        call_args = mock_gen.call_args
        assert call_args[0][1] == 'Fallback text'

    @patch('minimax_cli.generate_music')
    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_generate_music_dispatch(self, mock_key, mock_gen):
        mock_gen.return_value = {"status": "success",
                                  "generated_audio": "/x.mp3",
                                  "duration_ms": 60000,
                                  "model": "music-2.5"}
        with patch('sys.argv', ['cli', '--task', 'generate-music',
                                 '--lyrics', 'La la la']):
            cli.main()
        mock_gen.assert_called_once()

    @patch('minimax_cli.generate_video')
    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_generate_video_dispatch(self, mock_key, mock_gen):
        mock_gen.return_value = {"status": "success",
                                  "generated_video": "/x.mp4",
                                  "generation_time": 30.0,
                                  "model": "MiniMax-Hailuo-2.3"}
        with patch('sys.argv', ['cli', '--task', 'generate-video',
                                 '--prompt', 'A dancer']):
            cli.main()
        mock_gen.assert_called_once()

    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_auto_model_detection(self, mock_key):
        with patch('sys.argv', ['cli', '--task', 'generate-speech',
                                 '--text', 'hi']):
            with patch('minimax_cli.generate_speech') as mock_gen:
                mock_gen.return_value = {"status": "success",
                                          "generated_audio": "/x.mp3",
                                          "model": "speech-2.8-hd"}
                cli.main()
                # Model should be auto-detected
                assert mock_gen.call_args[0][2] == 'speech-2.8-hd'

    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_explicit_model_override(self, mock_key):
        with patch('sys.argv', ['cli', '--task', 'generate-speech',
                                 '--text', 'hi', '--model', 'speech-2.8-turbo']):
            with patch('minimax_cli.generate_speech') as mock_gen:
                mock_gen.return_value = {"status": "success",
                                          "generated_audio": "/x.mp3",
                                          "model": "speech-2.8-turbo"}
                cli.main()
                assert mock_gen.call_args[0][2] == 'speech-2.8-turbo'

    @patch('minimax_cli.generate_image')
    @patch('minimax_cli.find_minimax_api_key', return_value='test-key')
    def test_exception_exits_with_1(self, mock_key, mock_gen):
        mock_gen.side_effect = Exception("API timeout")
        with patch('sys.argv', ['cli', '--task', 'generate',
                                 '--prompt', 'test']):
            with pytest.raises(SystemExit) as exc_info:
                cli.main()
            assert exc_info.value.code == 1
