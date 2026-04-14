# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import subprocess

from setuptools import find_packages
from setuptools import setup
from setuptools.command.develop import develop
from setuptools.command.install import install


def get_requirements(filename):
    with open(filename) as f:
        return [line.strip() for line in f if line.strip() and not line.startswith("#")]


def install_pre_commit():
    try:
        subprocess.check_call(["pre-commit", "install"])
        print("Pre-commit hooks installed successfully!")
    except subprocess.CalledProcessError:
        print("Failed to install pre-commit hooks. Please run 'pre-commit install' manually.")
    except FileNotFoundError:
        print("Pre-commit not found. Please install pre-commit first: pip install pre-commit")


class PostDevelopCommand(develop):
    """Post-installation for development mode."""

    def run(self):
        develop.run(self)
        install_pre_commit()


class PostInstallCommand(install):
    """Post-installation for installation mode."""

    def run(self):
        install.run(self)
        install_pre_commit()


requirements = get_requirements("requirements.txt")

setup(
    name="pi",
    version="1.0.3",
    description="Plane Intelligence for the win!",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    packages=find_packages(where="pi", exclude=["*.tests", "*.tests.*", "tests.*", "tests"]),
    package_dir={"": "pi"},
    install_requires=requirements,
    extras_require={
        "dev": [
            "pre-commit==3.8.0",
            "mypy==1.11.1",
            "mypy-extensions==1.0.0",
            "ruff==0.5.5",
            "pylint==3.1.0",
            "types-requests==2.32.0.20240712",
            "pytest==9.0.3",
        ],
    },
    cmdclass={
        "develop": PostDevelopCommand,
        "install": PostInstallCommand,
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.12",
)
