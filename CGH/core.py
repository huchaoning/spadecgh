import numpy as np
from numpy import pi

from math import factorial

from scipy.special import hermite, laguerre
from scipy.interpolate import interp1d

from os import path
from PIL import Image


__all__ = ['SLM', 'HG', 'LG', 'AdvHG', 'CGH']


class SLM:
    device = 'HoloEye, PLUTO-2-NIR-011'

    pixel_size = 8
    resolution = (1920, 1080)
    
    x, y = np.meshgrid(
           np.arange(-resolution[0]/2, resolution[0]/2) * pixel_size,
          -np.arange(-resolution[1]/2, resolution[1]/2) * pixel_size)
    
    rho = x**2 + y**2

    norm_x = x / (resolution[0] * pixel_size)
    norm_y = y / (resolution[1] * pixel_size)



class _Mode:
    def __init__(self, n, m):
        valid = all(isinstance(x, int) and x >= 0 for x in (n, m))
        if valid:
            self.n = n
            self.m = m
        else:
            raise ValueError('orders must be positive integers')
    
    @classmethod
    def check(self, inputs):
        if not isinstance(inputs, (HG, LG, AdvHG)):
            raise ValueError('mode must be a instance of HG or LG')



class HG(_Mode):
    def complex_amplitude(self, w0):
        n, m = self.n, self.m
        norm = np.sqrt(2**(1-n-m) / (pi * factorial(m) * factorial(n))) / w0
        hx, hy= hermite(n)(2**.5 * SLM.x / w0), hermite(m)(2**.5 * SLM.y / w0)
        amplitude = norm * hx * hy * np.exp(-SLM.rho/(w0**2))

        return amplitude * np.exp(0j)
    


class LG(_Mode):
    def __init__(self):
        raise NotImplementedError('LG mode is not supported yet')



class AdvHG:
    def __init__(self, pm):
        if pm in (-1, 1):
            self.pm = pm
        else:
            raise ValueError('pm must be -1 or 1, 1 stands for + mode, -1 stands for - mode')

    def complex_amplitude(self, w0):
        hg00 = HG(0, 0).complex_amplitude(w0)
        hg01 = HG(0, 1).complex_amplitude(w0)
        return (hg00 + self.pm * hg01) / 2**.5



class CGH:
    def __init__(self, sigma, *modes, nx=500, ny=50):

        [_Mode.check(mode) for mode in modes]

        w0 = 2*sigma

        if len(modes) == 1:
            ca = modes[0].complex_amplitude(w0)

        elif len(modes) == 2:
            ca0, ca1 = [m.complex_amplitude(w0) for m in modes]
            ca = ca0*np.exp(2j*pi*SLM.norm_y*ny) + ca1*np.exp(-2j*pi*SLM.norm_y*ny)

        else:
            raise ValueError('invalid modes parameter, possibly due to ' +
                             'the number of modes being <= 0, or > 2')
        
        fx2 = interp1d(np.linspace(0, 1, 801), np.load(path.join(path.dirname(__file__), 'fx2.npy')))
        a = np.abs(ca) / np.abs(ca).max()
        phi = np.angle(ca)

        _temp = fx2(a) * np.sin(phi + 2*pi*SLM.norm_x*nx)
        
        _temp = ((_temp - _temp.min()) / (_temp.max() - _temp.min())) * 255

        self.cgh = _temp.astype(np.uint8)
        self.img = Image.fromarray(self.cgh)

    def result(self):
        return self.cgh
    
    def show(self):
        self.img.show()
    
    def save(self, file):
        file = path.expanduser(file)
        if not path.exists(file):
            self.img.save(file)
        else:
            raise FileExistsError(f'{file} already exists')
