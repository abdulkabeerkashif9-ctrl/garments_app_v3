from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in garments_app_v3/__init__.py
from garments_app_v3 import __version__ as version

setup(
	name="garments_app_v3",
	version=version,
	description="this is new garments app",
	author="Tech Ventured",
	author_email="safdar211@gamil.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
