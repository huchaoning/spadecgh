# Usage

This guide covers the key features of the SpadeCGH toolkit, showcasing how to combine optical modes, accelerate computations, and use different execution backends.


## Mode superposition (Plus-and-Minus mode)

One of the key features of SpadeCGH is the ability to combine multiple modes using standard mathematical operators (`+`, `-`).
The toolkit will automatically flattens the mode tree and normalizes the resulting wave function.

Here is how you can generate a superposition mode, we call Plus-and-Minus (PM) mode, of two Hermite-Gaussian (HG) modes :

```python
from spadecgh import *

cgh = CGH(sigma=100)

# Using '+' operator like a mathematical formula
pm_mode = HG(0, 0) + HG(1, 0)

# Add the PM mode to the CGH instance
cgh.add_modes(pm_mode, nx_list=500, ny_list=0)

cgh.cal()
cgh.show()
```

### Examples 

Suppose that you want to decompose the optical field into two HG modes, you can add multiple modes into `CGH` instance:

```python
from spadecgh import *

cgh = CGH(sigma=100)

# Add HG mode twice
cgh.add_modes(HG(0, 0), nx_list=500, ny_list=50)
cgh.add_modes(HG(0, 1), nx_list=500, ny_list=-50)
```

Or you can call `add_modes` one time:

```python
cgh.add_modes([HG(0, 0), HG(0, 1)], nx_list=[500, 500], ny_list=[50, -50])
```

After that, call

```python
cgh.cal()
cgh.show()
```

---


