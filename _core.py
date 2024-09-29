import numpy as np
from math import *

from matplotlib import pyplot as plt
from scipy.special import hermite, laguerre

# from .futils import min_max_normalize as nl
# from .macro import fast_meshgrid, square_abs
# from .plotter import imshow

__all__ = ['SLM', 'HG', 'LG', 'LASER']



def _I(arr):
    temp = np.square(np.abs(arr))
    temp = temp / temp.max()
    return temp


class SLM:
    pixel_size = 8
    resolution = (1920, 1080)
    
    x, y = np.meshgrid(
           np.arange(-resolution[0]/2, resolution[0]/2),
          -np.arange(-resolution[1]/2, resolution[1]/2)
        ) * pixel_size


class HG:
    def __init__(self, n, m):
        self.n = n
        self.m = m

    def pattern(self, scale=30):
        x, y = np.meshgrid(np.arange(-150, 150) * scale, -np.arange(-150, 150) / scale)
        rho = np.square(x) + np.square(y)
        img = hermite(self.n)(x) * hermite(self.m)(y) * np.exp(-rho/2)

        plt.imshow(_I(img))
        plt.title(r'$\rm HG_{'+f'{self.n},{self.m}'+'}$')
        plt.show()


class LG:
    def __init__(self, n, m):
        self.n = n
        self.m = m
        raise TypeError('LG is not supported yet')

    def pattern(self, scale=30):
        raise TypeError('LG is not supported yet')


class LASER:
    def __init__(self, wavelength = None, beam_waist = None, mode = None):
        self.wavelength = wavelength
        self.wave_number = tau / self.wavelength
        self.beam_waist = beam_waist
        self.rayleigh_range = (pi * self.beam_waist**2) / self.wavelength
        if isinstance(mode, (HG, LG)):
            self.mode = mode
        elif mode is None:
            self.mode = None
        else:
            raise TypeError('LASER.mode must be HG or LG')


    def beam_size(self, z):
        return self.beam_waist * sqrt(1 + (z / self.rayleigh_range)**2)


    def gouy_phase(self, z):
        return atan(z / self.rayleigh_range)


    def wave_radius_of_curvature(self, z):
        return inf if z==0 else z * (1 + (self.rayleigh_range / z)**2)


    def amplitude(self, x, y, z):
        rho = np.square(x) + np.square(y)
        w = self.beam_size(z)

        if isinstance(self.mode, HG):
            n, m = self.mode.n, self.mode.m
            hx, hy= hermite(n)(sqrt(2)*x/w), hermite(m)(sqrt(2)*y/w)
            amplitude = hx*hy*np.exp(-rho/(w**2))
            return amplitude / np.abs(amplitude).sum()

        elif isinstance(self.mode, LG):
            raise TypeError('LG is not supported yet')


    def phase(self, x, y, z):
        rho = np.square(x) + np.square(y)
        xi = self.gouy_phase(z)
        k = self.wave_number
        r = self.wave_radius_of_curvature(z)

        if isinstance(self.mode, HG):
            n, m = self.mode.n, self.mode.m
            return np.exp(1j*(k*(rho**2/(2*r)+z)-xi*(n+m+1)))

        elif isinstance(self.mode, LG):
            pass # LG 模式的相位, 待补充


    def complex_amplitude(self, x, y, z):
        return self.amplitude(x, y, z) * self.phase(x, y, z)



class CGH:
    
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

        return (_I(img) * 255).astype(np.uint8)



