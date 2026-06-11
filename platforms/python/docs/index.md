# HDUQ Python utils documentations

[![pypi](https://img.shields.io/pypi/v/hduq.svg)](https://pypi.org/project/hduq/)
[![python](https://img.shields.io/badge/python-3%2B-blue)](https://www.python.org/downloads/)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/huchaoning/hduq/blob/main/LICENSE)


## Architecture

To prevent dependency bloat, `hduq` adopts an **Isolated Architecture**:

- Installing the core `hduq` package will not install any heavy third-party dependencies.

- Submodules are fully isolated. To use a specific submodule, you must install its corresponding extra dependencies.


## Installation

This package is available on `pypi.org`.
It is recommended to install it via `pip`.
Note that due to the isolated architecture, installing `hduq` directly provides nothing.
You must specify the submodule you want to use.
