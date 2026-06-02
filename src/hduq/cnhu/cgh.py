import numpy as np
from numpy import pi

from math import factorial

from scipy.special import hermite, laguerre

from os import path
from PIL import Image

import json
from scipy.interpolate import interp1d
import importlib.resources as resources
with resources.files('hduq.cnhu.assets').joinpath('fx2.npy').open('rb') as f:
    _fx2 = interp1d(np.linspace(0, 1, 801), np.load(f))


__all__ = ['SLM', 'HG', 'LG', 'PM', 'CGH']



class SLM:
    device = 'HoloEye, PLUTO-2-NIR-011'

    pixel_size = 8
    resolution = (1920, 1080)
    
    x, y = np.meshgrid(
           np.arange(-resolution[0]/2, resolution[0]/2) * pixel_size,
          -np.arange(-resolution[1]/2, resolution[1]/2) * pixel_size)
    
    norm_x = x / (resolution[0] * pixel_size)
    norm_y = y / (resolution[1] * pixel_size)


class _FFTUtils:
    def __init__(self, slm_cls):
        self.resolution = slm_cls.resolution

        self.norm_x = np.fft.ifftshift(slm_cls.norm_x) / SLM.pixel_size
        self.norm_y = np.fft.ifftshift(slm_cls.norm_y) / SLM.pixel_size

    def fft(self, U_input):
        return np.fft.fft2(U_input)

    def ifft(self, U_focal):
        return np.fft.ifft2(U_focal)


class _Mode:
    @staticmethod
    def check(inputs):
        if not isinstance(inputs, (HG, LG, PM)):
            raise ValueError('invalid mode')
        return inputs
    
    def __add__(self, other):
        return PM(self, other, '+')
    
    def __sub__(self, other):
        return PM(self, other, '-')

    def __repr__(self):
        return f'{self.__class__.__name__}({self.order1}, {self.order2}, {self.x_shift}, {self.y_shift})'


class PM(_Mode):
    def __init__(self, mode1, mode2, pm):
        self.mode1 = _Mode.check(mode1)
        self.mode2 = _Mode.check(mode2)
        self.pm = pm
        self.norm = self.mode1.norm + self.mode2.norm


    def wave_function(self, sigma):
        wf1 = self.mode1.wave_function(sigma)
        wf2 = self.mode2.wave_function(sigma)
        if self.pm == '+':
            return (wf1 + wf2) / np.sqrt(self.norm)
        elif self.pm == '-':
            return (wf1 - wf2) / np.sqrt(self.norm)
        else:
            raise ValueError('invalid `pm` option')


    def __repr__(self):
        return f'{self.mode1} {self.pm} {self.mode2}'



class HG(_Mode):
    def __init__(self, n, m, x_shift=0., y_shift=0.):
        if all(isinstance(x, int) and x >= 0 for x in (n, m)):
            self.order1 = n
            self.order2 = m
            self.norm = 1

            self.x_shift, self.y_shift = x_shift, y_shift
            self.x, self.y = SLM.x + x_shift, SLM.y + y_shift
            self.rho = self.x**2 + self.y**2
        else:
            raise ValueError('orders must be positive integers')


    def wave_function(self, sigma):
        w0 = 2*sigma
        n, m = self.order1, self.order2

        N = np.sqrt(2**(1-n-m) / (pi * factorial(m) * factorial(n))) / w0
        hx, hy= hermite(n)(2**.5 * self.x / w0), hermite(m)(2**.5 * self.y / w0)
        ca = N * hx * hy * np.exp(-self.rho/(w0**2))
        a, phi = np.abs(ca), np.angle(ca)

        return a * np.exp(1j * phi)


class LG(_Mode):
    def __init__(self):
        raise NotImplementedError('LG mode is not supported yet')



class CGH:
    def __init__(self, sigma: float, quiet=False):
        self.sigma = sigma
        self.mode_list, self.nx_list, self.ny_list = [], [], []
        self.cgh = None

        self._is_quiet = quiet
        self._is_frozen = False
        self._is_cached = False


    def _check_cgh(self):
        if not self.mode_list:
            raise RuntimeError('No modes added. Use add_modes() to add at least one mode.')
        if self.cgh is None:
            if not self._is_quiet: print('CGH not generated. Running cal() automatically...')
            self.cal()

    
    def freeze(self):
        self._is_frozen = True
        if not self._is_quiet: print('this CGH instance is now frozen')

    
    def unfreeze(self):
        self._is_frozen = False
        self._is_cached = False
        if not self._is_quiet: print('this CGH instance is now unfrozen')

    
    def _check_frozen(self):
        if self._is_frozen:
            raise RuntimeError('this instance is frozen, call `.unfreeze()` before modifying `mode_list`')


    def add_modes(self, mode_list, nx_list, ny_list):
        self._check_frozen()
        mode_list = np.atleast_1d(mode_list)
        nx_list = np.atleast_1d(nx_list)
        ny_list = np.atleast_1d(ny_list)

        for mode in mode_list:
            _Mode.check(mode)

        if not (len(mode_list) == len(nx_list) == len(ny_list)):
            raise ValueError('mode_list, nx_list, and ny_list must have the same length')
        
        self.mode_list.extend(mode_list)
        self.nx_list.extend(nx_list)
        self.ny_list.extend(ny_list)
 
    
    def clear_modes(self):
        self._check_frozen()
        if not self._is_quiet: print('resetting...')
        self.mode_list, self.nx_list, self.ny_list = [], [], []
        self.cgh = None


    @staticmethod
    def fx2(x):
        return _fx2(x)
    

    def _cal_V(self):
        V = 0
        for i, mode in enumerate(self.mode_list):
            V = V + (mode.wave_function(self.sigma) * np.exp(2j*pi * (SLM.norm_x*self.nx_list[i] + SLM.norm_y*self.ny_list[i])))

        return V


    def cal(self, x_shift_fast=0., y_shift_fast=0.):
        if not self._is_frozen and (x_shift_fast != 0. or y_shift_fast != 0.):
            raise ValueError('instance must be frozen before using `x_shift_fast` or `y_shift_fast`')
        
        if not self._is_frozen:
            V = self._cal_V()
        
        if self._is_frozen and not self._is_cached:
            V = self._cal_V()
            self.fft = _FFTUtils(SLM)
            self.cache = self.fft.fft(V)
            self._is_cached = True
        
        if self._is_frozen and self._is_cached:
            V = self.fft.ifft(self.cache * np.exp(2j*pi * (self.fft.norm_x*x_shift_fast + self.fft.norm_y*y_shift_fast)))

        a = np.abs(V) / np.abs(V).max()
        phi = np.angle(V)

        _temp = self.fx2(a) * np.sin(phi)
        _temp = ((_temp - _temp.min()) / (_temp.max() - _temp.min())) * 255

        self.cgh = _temp.astype(np.uint8)
        self.img = Image.fromarray(self.cgh)


    def result(self):
        self._check_cgh()
        return self.cgh


    def show(self):
        self._check_cgh()
        self.img.show()


    def save(self, file, override=False):
        self._check_cgh()
        file = path.expanduser(file)
        if not path.exists(file) or override:
            self.img.save(file)
        else:
            raise FileExistsError(f'{file} already exists')


    def __repr__(self):
        lines = [
            '========================= CGH TASK GRAPH =========================',
            f' Sigma: {self.sigma};    Quiet: {self._is_quiet};    Frozen: {self._is_frozen};    Cached: {self._is_cached}',
            '------------------------------------------------------------------',
            ' ID   | (nx, ny)       | Mode(order_1, order_2, x_shift, y_shift)',
            '------------------------------------------------------------------'
        ]
        
        for i, (m, nx, ny) in enumerate(zip(self.mode_list, self.nx_list, self.ny_list)):
            nx_v = nx.item() if hasattr(nx, 'item') else nx
            ny_v = ny.item() if hasattr(ny, 'item') else ny
            
            freq_str = f'({nx_v}, {ny_v})'
            lines.append(f' {i:<4} | {freq_str:<14} | {repr(m)}')
            
        lines.append('==================================================================')
        return '\n'.join(lines)

    def print(self):
        print(self.__repr__())

