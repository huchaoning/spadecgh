# Documentation of SpadeCGH [Quantum@HDU]

**Computer-generated hologram toolkit by Quantum Metrology Laboratory, Hangzhou Dianzi University.**

[![pypi](https://img.shields.io/pypi/v/spadecgh)](https://pypi.org/project/spadecgh/)
[![python](https://img.shields.io/badge/python-3%2B-blue)](https://www.python.org/downloads/)
[![license](https://img.shields.io/badge/license-BSD--3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

## Installation

Install locally with pip:

```bash
pip install spadecgh
```

Then import it in your Python code:

```python
import spadecgh
```


## Quick start

Here is a example to generate computer-generated hologram (CGH) for a Laguerre-Gaussian mode using the Arrizón algorithm:
```python
from spadecgh import *

# Initialize CGH with beam characteristic width parameters
cgh = CGH(sigma=100)

# Add a target mode with spatial frequencies (nx, ny)
cgh.add_modes(LG(l=1, p=0), nx_list=500, ny_list=0)

# Calculate and display the hologram image
cgh.cal(algorithm='arrizon')
cgh.show()
```


## Web application

A ready‑to‑use web version is also available, no installation required:

👉 [Open web app](https://hducgh.researchi.group/web-app)

