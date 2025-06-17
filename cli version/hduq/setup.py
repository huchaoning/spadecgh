from setuptools import setup, find_packages

setup(
    name='hduq',
    version='0.0.1',
    packages=find_packages(),
    include_package_data=True,
    package_data={'hduq.asset': ['*']},
    entry_points={
        'console_scripts': [
            'hduq=hduq.cli:main',
        ],
    },
    install_requires=[
        'numpy',
        'scipy',
        'Pillow',
    ],
    python_requires='>=3.9',
    description='HDUQ CLI tool',
    author='Chao-Ning Hu',
)
