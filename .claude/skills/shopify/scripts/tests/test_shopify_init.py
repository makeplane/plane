"""
Tests for shopify_init.py

Run with: pytest test_shopify_init.py -v --cov=shopify_init --cov-report=term-missing
"""

import os
import sys
import json
import pytest
import subprocess
from pathlib import Path
from unittest.mock import Mock, patch, mock_open, MagicMock

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shopify_init import EnvLoader, EnvConfig, ShopifyInitializer


class TestEnvLoader:
    """Test EnvLoader class."""

    def test_load_env_file_success(self, tmp_path):
        """Test loading valid .env file."""
        env_file = tmp_path / ".env"
        env_file.write_text("""
SHOPIFY_API_KEY=test_key
SHOPIFY_API_SECRET=test_secret
SHOP_DOMAIN=test.myshopify.com
# Comment line
SCOPES=read_products,write_products
""")

        result = EnvLoader.load_env_file(env_file)

        assert result['SHOPIFY_API_KEY'] == 'test_key'
        assert result['SHOPIFY_API_SECRET'] == 'test_secret'
        assert result['SHOP_DOMAIN'] == 'test.myshopify.com'
        assert result['SCOPES'] == 'read_products,write_products'

    def test_load_env_file_with_quotes(self, tmp_path):
        """Test loading .env file with quoted values."""
        env_file = tmp_path / ".env"
        env_file.write_text("""
SHOPIFY_API_KEY="test_key"
SHOPIFY_API_SECRET='test_secret'
""")

        result = EnvLoader.load_env_file(env_file)

        assert result['SHOPIFY_API_KEY'] == 'test_key'
        assert result['SHOPIFY_API_SECRET'] == 'test_secret'

    def test_load_env_file_nonexistent(self, tmp_path):
        """Test loading non-existent .env file."""
        result = EnvLoader.load_env_file(tmp_path / "nonexistent.env")
        assert result == {}

    def test_load_env_file_invalid_format(self, tmp_path):
        """Test loading .env file with invalid lines."""
        env_file = tmp_path / ".env"
        env_file.write_text("""
VALID_KEY=value
INVALID_LINE_NO_EQUALS
ANOTHER_VALID=test
""")

        result = EnvLoader.load_env_file(env_file)

        assert result['VALID_KEY'] == 'value'
        assert result['ANOTHER_VALID'] == 'test'
        assert 'INVALID_LINE_NO_EQUALS' not in result

    def test_get_env_paths(self, tmp_path):
        """Test getting .env file paths."""
        # Create directory structure
        claude_dir = tmp_path / ".claude"
        skills_dir = claude_dir / "skills"
        skill_dir = skills_dir / "shopify"

        skill_dir.mkdir(parents=True)

        # Create .env files
        (skill_dir / ".env").write_text("SKILL=1")
        (skills_dir / ".env").write_text("SKILLS=1")
        (claude_dir / ".env").write_text("CLAUDE=1")

        paths = EnvLoader.get_env_paths(skill_dir)

        assert len(paths) == 3
        assert skill_dir / ".env" in paths
        assert skills_dir / ".env" in paths
        assert claude_dir / ".env" in paths

    def test_load_config_priority(self, tmp_path, monkeypatch):
        """Test configuration loading priority."""
        skill_dir = tmp_path / "skill"
        skills_dir = tmp_path
        claude_dir = tmp_path.parent

        skill_dir.mkdir(parents=True)

        # Create .env files with different values
        (skill_dir / ".env").write_text("SHOPIFY_API_KEY=skill_key")
        (skills_dir / ".env").write_text("SHOPIFY_API_KEY=skills_key\nSHOP_DOMAIN=skills.myshopify.com")

        # Override with process env
        monkeypatch.setenv("SHOPIFY_API_KEY", "process_key")

        config = EnvLoader.load_config(skill_dir)

        # Process env should win
        assert config.shopify_api_key == "process_key"
        # Shop domain from skills/.env
        assert config.shop_domain == "skills.myshopify.com"

    def test_load_config_no_files(self, tmp_path):
        """Test configuration loading with no .env files."""
        config = EnvLoader.load_config(tmp_path)

        assert config.shopify_api_key is None
        assert config.shopify_api_secret is None
        assert config.shop_domain is None
        assert config.scopes is None


class TestShopifyInitializer:
    """Test ShopifyInitializer class."""

    @pytest.fixture
    def config(self):
        """Create test config."""
        return EnvConfig(
            shopify_api_key="test_key",
            shopify_api_secret="test_secret",
            shop_domain="test.myshopify.com",
            scopes="read_products,write_products"
        )

    @pytest.fixture
    def initializer(self, config):
        """Create initializer instance."""
        return ShopifyInitializer(config)

    def test_prompt_with_default(self, initializer):
        """Test prompt with default value."""
        with patch('builtins.input', return_value=''):
            result = initializer.prompt("Test", "default_value")
            assert result == "default_value"

    def test_prompt_with_input(self, initializer):
        """Test prompt with user input."""
        with patch('builtins.input', return_value='user_input'):
            result = initializer.prompt("Test", "default_value")
            assert result == "user_input"

    def test_select_option_valid(self, initializer):
        """Test select option with valid choice."""
        options = ['app', 'extension', 'theme']
        with patch('builtins.input', return_value='2'):
            result = initializer.select_option("Choose", options)
            assert result == 'extension'

    def test_select_option_invalid_then_valid(self, initializer):
        """Test select option with invalid then valid choice."""
        options = ['app', 'extension']
        with patch('builtins.input', side_effect=['5', 'invalid', '1']):
            result = initializer.select_option("Choose", options)
            assert result == 'app'

    def test_check_cli_installed_success(self, initializer):
        """Test CLI installed check - success."""
        mock_result = Mock()
        mock_result.returncode = 0

        with patch('subprocess.run', return_value=mock_result):
            assert initializer.check_cli_installed() is True

    def test_check_cli_installed_failure(self, initializer):
        """Test CLI installed check - failure."""
        with patch('subprocess.run', side_effect=FileNotFoundError):
            assert initializer.check_cli_installed() is False

    def test_create_app_config(self, initializer, tmp_path):
        """Test creating app configuration file."""
        initializer.create_app_config(tmp_path, "test-app", "read_products")

        config_file = tmp_path / "shopify.app.toml"
        assert config_file.exists()

        content = config_file.read_text()
        assert 'name = "test-app"' in content
        assert 'scopes = "read_products"' in content
        assert 'client_id = "test_key"' in content

    def test_create_extension_config(self, initializer, tmp_path):
        """Test creating extension configuration file."""
        initializer.create_extension_config(tmp_path, "test-ext", "checkout")

        config_file = tmp_path / "shopify.extension.toml"
        assert config_file.exists()

        content = config_file.read_text()
        assert 'name = "test-ext"' in content
        assert 'purchase.checkout.block.render' in content

    def test_create_extension_config_admin_action(self, initializer, tmp_path):
        """Test creating admin action extension config."""
        initializer.create_extension_config(tmp_path, "admin-ext", "admin_action")

        config_file = tmp_path / "shopify.extension.toml"
        content = config_file.read_text()
        assert 'admin.product-details.action.render' in content

    def test_create_readme(self, initializer, tmp_path):
        """Test creating README file."""
        initializer.create_readme(tmp_path, "app", "Test App")

        readme_file = tmp_path / "README.md"
        assert readme_file.exists()

        content = readme_file.read_text()
        assert '# Test App' in content
        assert 'shopify app dev' in content

    @patch('builtins.input')
    @patch('builtins.print')
    def test_init_app(self, mock_print, mock_input, initializer, tmp_path, monkeypatch):
        """Test app initialization."""
        monkeypatch.chdir(tmp_path)

        # Mock user inputs
        mock_input.side_effect = ['my-app', 'read_products,write_products']

        initializer.init_app()

        # Check directory created
        app_dir = tmp_path / "my-app"
        assert app_dir.exists()

        # Check files created
        assert (app_dir / "shopify.app.toml").exists()
        assert (app_dir / "README.md").exists()
        assert (app_dir / "package.json").exists()

        # Check package.json content
        package_json = json.loads((app_dir / "package.json").read_text())
        assert package_json['name'] == 'my-app'
        assert 'dev' in package_json['scripts']

    @patch('builtins.input')
    @patch('builtins.print')
    def test_init_extension(self, mock_print, mock_input, initializer, tmp_path, monkeypatch):
        """Test extension initialization."""
        monkeypatch.chdir(tmp_path)

        # Mock user inputs: type selection (1 = checkout), name
        mock_input.side_effect = ['1', 'my-extension']

        initializer.init_extension()

        # Check directory and files created
        ext_dir = tmp_path / "my-extension"
        assert ext_dir.exists()
        assert (ext_dir / "shopify.extension.toml").exists()
        assert (ext_dir / "README.md").exists()

    @patch('builtins.input')
    @patch('builtins.print')
    def test_init_theme(self, mock_print, mock_input, initializer):
        """Test theme initialization."""
        mock_input.return_value = 'my-theme'

        # Should just print instructions
        initializer.init_theme()

        # Verify print was called (instructions shown)
        assert mock_print.called

    @patch('builtins.print')
    def test_run_no_cli(self, mock_print, initializer):
        """Test run when CLI not installed."""
        with patch.object(initializer, 'check_cli_installed', return_value=False):
            with pytest.raises(SystemExit) as exc_info:
                initializer.run()
            assert exc_info.value.code == 1

    @patch.object(ShopifyInitializer, 'check_cli_installed', return_value=True)
    @patch.object(ShopifyInitializer, 'init_app')
    @patch('builtins.input')
    @patch('builtins.print')
    def test_run_app_selected(self, mock_print, mock_input, mock_init_app, mock_cli_check, initializer):
        """Test run with app selection."""
        mock_input.return_value = '1'  # Select app

        initializer.run()

        mock_init_app.assert_called_once()

    @patch.object(ShopifyInitializer, 'check_cli_installed', return_value=True)
    @patch.object(ShopifyInitializer, 'init_extension')
    @patch('builtins.input')
    @patch('builtins.print')
    def test_run_extension_selected(self, mock_print, mock_input, mock_init_ext, mock_cli_check, initializer):
        """Test run with extension selection."""
        mock_input.return_value = '2'  # Select extension

        initializer.run()

        mock_init_ext.assert_called_once()


class TestMain:
    """Test main function."""

    @patch('shopify_init.ShopifyInitializer')
    @patch('shopify_init.EnvLoader')
    def test_main_success(self, mock_loader, mock_initializer):
        """Test main function success path."""
        from shopify_init import main

        mock_config = Mock()
        mock_loader.load_config.return_value = mock_config

        mock_init_instance = Mock()
        mock_initializer.return_value = mock_init_instance

        with patch('builtins.print'):
            main()

        mock_init_instance.run.assert_called_once()

    @patch('shopify_init.ShopifyInitializer')
    @patch('sys.exit')
    def test_main_keyboard_interrupt(self, mock_exit, mock_initializer):
        """Test main function with keyboard interrupt."""
        from shopify_init import main

        mock_initializer.return_value.run.side_effect = KeyboardInterrupt

        with patch('builtins.print'):
            main()

        mock_exit.assert_called_with(0)

    @patch('shopify_init.ShopifyInitializer')
    @patch('sys.exit')
    def test_main_exception(self, mock_exit, mock_initializer):
        """Test main function with exception."""
        from shopify_init import main

        mock_initializer.return_value.run.side_effect = Exception("Test error")

        with patch('builtins.print'):
            main()

        mock_exit.assert_called_with(1)


class TestEnvConfig:
    """Test EnvConfig dataclass."""

    def test_env_config_defaults(self):
        """Test EnvConfig default values."""
        config = EnvConfig()

        assert config.shopify_api_key is None
        assert config.shopify_api_secret is None
        assert config.shop_domain is None
        assert config.scopes is None

    def test_env_config_with_values(self):
        """Test EnvConfig with values."""
        config = EnvConfig(
            shopify_api_key="key",
            shopify_api_secret="secret",
            shop_domain="test.myshopify.com",
            scopes="read_products"
        )

        assert config.shopify_api_key == "key"
        assert config.shopify_api_secret == "secret"
        assert config.shop_domain == "test.myshopify.com"
        assert config.scopes == "read_products"
