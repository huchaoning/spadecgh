import numpy as np

from ..equipments import slm
from ..futils import min_max_normalize as nl
from ..macro import fast_meshgrid


(h, v), p = slm.resolution, slm.pixel_size
x, y = np.meshgrid(np.arange(-h/2, h/2), -np.arange(-v/2, v/2))
x, y = x*p, y*p


def fx(method=2, original=False):
    from os import path
    fx = np.load(path.join(path.dirname(__file__), f'fx{method}.npy'))
    if original:
        return fx
    else:
        from scipy.interpolate import interp1d
        return interp1d(np.linspace(0, 1, 801), fx)


def superposition(mode_1, mode_2, split=50):
    return mode_1*np.exp(2j*np.pi*y*split/(v*p))+mode_2*np.exp(-2j*np.pi*y*split/(v*p))


def gen(complex_amplitude=None, method=2, nx=500, ny=0): 
    f = fx(method=method)
    a = np.abs(complex_amplitude) / np.abs(complex_amplitude).max()
    phi = np.angle(complex_amplitude)

    if method == 1:
        img = phi + f(a) * np.sin(phi + (2*np.pi*(x*nx/(h*p)+y*ny/(v*p))))
    elif method == 2:
        img = f(a) * np.sin(phi + (2*np.pi*(x*nx/(h*p)+y*ny/(v*p))))

    return (nl(img) * 255).astype(np.uint8)

