"""
Tests for cloudflare-deploy.py

Run with: pytest test_cloudflare_deploy.py -v
"""

import pytest
import subprocess
from pathlib import Path
from unittest.mock import Mock, patch, mock_open
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from cloudflare_deploy import CloudflareDeploy, CloudflareDeployError


@pytest.fixture
def temp_project(tmp_path):
    """Create temporary project directory with wrangler.toml"""
    project_dir = tmp_path / "test-worker"
    project_dir.mkdir()

    wrangler_toml = project_dir / "wrangler.toml"
    wrangler_toml.write_text('''
name = "test-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
''')

    return project_dir


@pytest.fixture
def deployer(temp_project):
    """Create CloudflareDeploy instance with temp project"""
    return CloudflareDeploy(
        project_dir=temp_project,
        env="staging",
        dry_run=False,
        verbose=False
    )


class TestCloudflareDeployInit:
    """Test CloudflareDeploy initialization"""

    def test_init_with_defaults(self, temp_project):
        deployer = CloudflareDeploy(project_dir=temp_project)
        assert deployer.project_dir == temp_project.resolve()
        assert deployer.env is None
        assert deployer.dry_run is False
        assert deployer.verbose is False

    def test_init_with_custom_params(self, temp_project):
        deployer = CloudflareDeploy(
            project_dir=temp_project,
            env="production",
            dry_run=True,
            verbose=True
        )
        assert deployer.env == "production"
        assert deployer.dry_run is True
        assert deployer.verbose is True


class TestValidateProject:
    """Test project validation"""

    def test_validate_existing_project(self, deployer):
        assert deployer.validate_project() is True

    def test_validate_nonexistent_project(self, tmp_path):
        deployer = CloudflareDeploy(project_dir=tmp_path / "nonexistent")
        with pytest.raises(CloudflareDeployError, match="does not exist"):
            deployer.validate_project()

    def test_validate_missing_wrangler_toml(self, tmp_path):
        project_dir = tmp_path / "no-toml"
        project_dir.mkdir()
        deployer = CloudflareDeploy(project_dir=project_dir)

        with pytest.raises(CloudflareDeployError, match="wrangler.toml not found"):
            deployer.validate_project()


class TestCheckWranglerInstalled:
    """Test wrangler CLI detection"""

    @patch('subprocess.run')
    def test_wrangler_installed(self, mock_run, deployer):
        mock_run.return_value = Mock(
            returncode=0,
            stdout="wrangler 3.0.0",
            stderr=""
        )
        assert deployer.check_wrangler_installed() is True

    @patch('subprocess.run')
    def test_wrangler_not_installed(self, mock_run, deployer):
        mock_run.side_effect = FileNotFoundError()
        assert deployer.check_wrangler_installed() is False

    @patch('subprocess.run')
    def test_wrangler_command_fails(self, mock_run, deployer):
        mock_run.side_effect = subprocess.CalledProcessError(1, "wrangler")
        assert deployer.check_wrangler_installed() is False


class TestGetWorkerName:
    """Test worker name extraction"""

    def test_get_worker_name_success(self, deployer):
        name = deployer.get_worker_name()
        assert name == "test-worker"

    def test_get_worker_name_no_name(self, tmp_path):
        project_dir = tmp_path / "no-name"
        project_dir.mkdir()

        wrangler_toml = project_dir / "wrangler.toml"
        wrangler_toml.write_text("main = 'index.ts'")

        deployer = CloudflareDeploy(project_dir=project_dir)
        with pytest.raises(CloudflareDeployError, match="Worker name not found"):
            deployer.get_worker_name()

    def test_get_worker_name_with_quotes(self, tmp_path):
        project_dir = tmp_path / "quoted"
        project_dir.mkdir()

        wrangler_toml = project_dir / "wrangler.toml"
        wrangler_toml.write_text('name = "my-worker"\n')

        deployer = CloudflareDeploy(project_dir=project_dir)
        assert deployer.get_worker_name() == "my-worker"

    def test_get_worker_name_single_quotes(self, tmp_path):
        project_dir = tmp_path / "single-quotes"
        project_dir.mkdir()

        wrangler_toml = project_dir / "wrangler.toml"
        wrangler_toml.write_text("name = 'my-worker'\n")

        deployer = CloudflareDeploy(project_dir=project_dir)
        assert deployer.get_worker_name() == "my-worker"


class TestBuildDeployCommand:
    """Test deploy command construction"""

    def test_basic_command(self, temp_project):
        deployer = CloudflareDeploy(project_dir=temp_project)
        cmd = deployer.build_deploy_command()
        assert cmd == ["wrangler", "deploy"]

    def test_command_with_env(self, temp_project):
        deployer = CloudflareDeploy(project_dir=temp_project, env="production")
        cmd = deployer.build_deploy_command()
        assert cmd == ["wrangler", "deploy", "--env", "production"]

    def test_command_with_dry_run(self, temp_project):
        deployer = CloudflareDeploy(project_dir=temp_project, dry_run=True)
        cmd = deployer.build_deploy_command()
        assert cmd == ["wrangler", "deploy", "--dry-run"]

    def test_command_with_env_and_dry_run(self, temp_project):
        deployer = CloudflareDeploy(
            project_dir=temp_project,
            env="staging",
            dry_run=True
        )
        cmd = deployer.build_deploy_command()
        assert cmd == ["wrangler", "deploy", "--env", "staging", "--dry-run"]


class TestRunCommand:
    """Test command execution"""

    @patch('subprocess.run')
    def test_run_command_success(self, mock_run, deployer):
        mock_run.return_value = Mock(
            returncode=0,
            stdout="Success",
            stderr=""
        )

        exit_code, stdout, stderr = deployer.run_command(["echo", "test"])

        assert exit_code == 0
        assert stdout == "Success"
        assert stderr == ""
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_run_command_failure_with_check(self, mock_run, deployer):
        mock_run.side_effect = subprocess.CalledProcessError(
            1, "cmd", stderr="Error"
        )

        with pytest.raises(CloudflareDeployError, match="Command failed"):
            deployer.run_command(["false"], check=True)

    @patch('subprocess.run')
    def test_run_command_failure_no_check(self, mock_run, deployer):
        mock_run.side_effect = subprocess.CalledProcessError(
            1, "cmd", output="", stderr="Error"
        )

        exit_code, stdout, stderr = deployer.run_command(["false"], check=False)

        assert exit_code == 1


class TestDeploy:
    """Test full deployment flow"""

    @patch.object(CloudflareDeploy, 'check_wrangler_installed')
    @patch.object(CloudflareDeploy, 'run_command')
    def test_deploy_success(self, mock_run_cmd, mock_check_wrangler, deployer):
        mock_check_wrangler.return_value = True
        mock_run_cmd.return_value = (0, "Deployed successfully", "")

        result = deployer.deploy()

        assert result is True
        mock_check_wrangler.assert_called_once()
        mock_run_cmd.assert_called_once()

    @patch.object(CloudflareDeploy, 'check_wrangler_installed')
    def test_deploy_wrangler_not_installed(self, mock_check_wrangler, deployer):
        mock_check_wrangler.return_value = False

        with pytest.raises(CloudflareDeployError, match="wrangler CLI not installed"):
            deployer.deploy()

    @patch.object(CloudflareDeploy, 'check_wrangler_installed')
    @patch.object(CloudflareDeploy, 'run_command')
    def test_deploy_command_fails(self, mock_run_cmd, mock_check_wrangler, deployer):
        mock_check_wrangler.return_value = True
        mock_run_cmd.side_effect = CloudflareDeployError("Deploy failed")

        with pytest.raises(CloudflareDeployError, match="Deploy failed"):
            deployer.deploy()

    def test_deploy_invalid_project(self, tmp_path):
        deployer = CloudflareDeploy(project_dir=tmp_path / "nonexistent")

        with pytest.raises(CloudflareDeployError):
            deployer.deploy()


class TestIntegration:
    """Integration tests"""

    @patch.object(CloudflareDeploy, 'check_wrangler_installed')
    @patch.object(CloudflareDeploy, 'run_command')
    def test_full_deployment_flow(self, mock_run_cmd, mock_check_wrangler, temp_project):
        mock_check_wrangler.return_value = True
        mock_run_cmd.return_value = (0, "Success", "")

        deployer = CloudflareDeploy(
            project_dir=temp_project,
            env="production",
            dry_run=False,
            verbose=True
        )

        result = deployer.deploy()

        assert result is True
        assert mock_run_cmd.call_count == 1

        # Verify correct command was built
        call_args = mock_run_cmd.call_args[0][0]
        assert "wrangler" in call_args
        assert "deploy" in call_args
        assert "--env" in call_args
        assert "production" in call_args


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
