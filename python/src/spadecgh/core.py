import numpy as np
from numpy import pi

from math import factorial

from scipy.special import hermite, genlaguerre

from os import path
from PIL import Image

from scipy.interpolate import interp1d
import importlib.resources as resources
with resources.files('spadecgh.assets').joinpath('fdavis_uint16.npy').open('rb') as f:
    _fdavis = interp1d(np.linspace(0, 1, 801), np.load(f).astype(float) * 1e-4)
with resources.files('spadecgh.assets').joinpath('farrizon_uint16.npy').open('rb') as f:
    _farrizon = interp1d(np.linspace(0, 1, 801), np.load(f).astype(float) * 1e-4)
with resources.files('spadecgh.assets').joinpath('fhybrid_uint16.npy').open('rb') as f:
    _fhybrid_data = np.load(f).astype(float) * 1e-4
    _fhybrid = [interp1d(np.linspace(0, 1, 801), _fhybrid_data[idx]) for idx in range(101)]

from ._hook import _CppBackend


__all__ = ['SLM', 'HG', 'LG', 'PM', 'CGH']


class SLM:
    @staticmethod
    def check(inputs):
        if not (isinstance(inputs, type) and issubclass(inputs, SLM)):
            raise ValueError('invalid SLM class')
        return inputs

    def __init_subclass__(cls):
        res = cls.resolution
        ps = cls.pixel_size

        cls.x, cls.y = np.meshgrid(
            np.arange(-res[0]/2, res[0]/2) * ps,
            -np.arange(-res[1]/2, res[1]/2) * ps
        )

        cls.norm_x = cls.x / (res[0] * ps)
        cls.norm_y = cls.y / (res[1] * ps)



class _DefaultSLM(SLM):
    device = 'HoloEye, PLUTO-2-NIR-011'

    pixel_size = 8
    resolution = (1920, 1080)


class _FFTUtils:
    def __init__(self, slm_cls):
        self.resolution = slm_cls.resolution

        self.norm_x = np.fft.ifftshift(slm_cls.norm_x) / slm_cls.pixel_size
        self.norm_y = np.fft.ifftshift(slm_cls.norm_y) / slm_cls.pixel_size

    def fft(self, U_input):
        return np.fft.fft2(U_input)

    def ifft(self, U_focal):
        return np.fft.ifft2(U_focal)



class _Mode:
    @staticmethod
    def check(inputs):
        if not isinstance(inputs, _Mode):
            raise ValueError('invalid mode')
        return inputs
    
    @property
    def is_leaf(self):
        return True
    
    def flatten(self):
        visitor = _FlattenVisitor()
        visitor.visit(self, 1)
        return visitor.plus, visitor.minus
    
    def __add__(self, other):
        return PM(self, other, '+')
    
    def __sub__(self, other):
        return PM(self, other, '-')
    
    def __neg__(self):
        return PM(_Zero(), self, '-')

    def __repr__(self):
        return f'{self.__class__.__name__}({self.order_1}, {self.order_2}, {self.x_shift}, {self.y_shift})'



class _Zero(_Mode):
    def wave_function(self, *args, **kwargs):
        return 0
    
    def __repr__(self):
        return '0'



class _FlattenVisitor:
    def __init__(self):
        self.plus = []
        self.minus = []

    def visit(self, node, sign=1):
        if node.is_leaf:
            if isinstance(node, _Zero):
                return

            if sign == 1:
                self.plus.append(node)
            elif sign == -1:
                self.minus.append(node)

        elif not node.is_leaf:
            self.visit(node.mode1, sign)

            if node.pm == '+':
                self.visit(node.mode2, sign)
            elif node.pm == '-':
                self.visit(node.mode2, -sign)




class PM(_Mode):
    def __init__(self, mode1, mode2, pm):
        self.mode1 = _Mode.check(mode1)
        self.mode2 = _Mode.check(mode2)
        self.pm = pm

    @property
    def is_leaf(self):
        return False

    def wave_function(self, sigma, slm_cls=_DefaultSLM):
        plus, minus = self.flatten()
        norm = len(plus) + len(minus)
        wf1 = self.mode1.wave_function(sigma, slm_cls)
        wf2 = self.mode2.wave_function(sigma, slm_cls)
        if self.pm == '+':
            return (wf1 + wf2) / np.sqrt(norm)
        elif self.pm == '-':
            return (wf1 - wf2) / np.sqrt(norm)
        else:
            raise ValueError('invalid `pm` option')


    def __repr__(self):
        return f'{self.mode1} {self.pm} {self.mode2}'



class HG(_Mode):
    def __init__(self, n, m, x_shift=0., y_shift=0.):
        if all(isinstance(x, int) and x >= 0 for x in (n, m)):
            self.order_1 = n
            self.order_2 = m

            self.x_shift, self.y_shift = x_shift, y_shift
        else:
            raise ValueError('n and m must be positive integers')

    # def wave_function(self, sigma, slm_cls=_DefaultSLM):
    #     SLM.check(slm_cls)
    #     w0 = 2*sigma
    #     n, m = self.order_1, self.order_2

    #     x, y = slm_cls.x + self.x_shift, slm_cls.y + self.y_shift
    #     rho = x**2 + y**2

    #     N = np.sqrt(2**(1-n-m) / (pi * factorial(m) * factorial(n))) / w0
    #     hx, hy= hermite(n)(2**.5 * x / w0), hermite(m)(2**.5 * y / w0)
    #     wf = N * hx * hy * np.exp(-rho/(w0**2))
    #     return wf.astype(complex)
    
    def wave_function(self, sigma, slm_cls=_DefaultSLM):
        SLM.check(slm_cls)
        w0 = 2 * sigma
        n, m = self.order_1, self.order_2
        N = np.sqrt(2**(1-n-m) / (pi * factorial(m) * factorial(n))) / w0

        x = slm_cls.x[0, :] + self.x_shift
        y = slm_cls.y[:, 0] + self.y_shift

        hx = hermite(n)(2**.5 * x / w0)
        wf_x = (hx * np.exp(-(x ** 2) / w0**2)).astype(complex)

        hy = hermite(m)(2**.5 * y / w0)
        wf_y = (hy * np.exp(-(y ** 2) / w0**2)).astype(complex)
       
        return N * (wf_y[:, np.newaxis] * wf_x)



class LG(_Mode):
    def __init__(self, l, p, x_shift=0., y_shift=0.):
        if all(isinstance(x, int) for x in (l, p)):
            self.order_1 = l
            if p >= 0:
                self.order_2 = p
            else:
                raise ValueError('p must be positive')

            self.x_shift, self.y_shift = x_shift, y_shift
        else:
            raise ValueError('l and p must be integers')

    def wave_function(self, sigma, slm_cls=_DefaultSLM):
        SLM.check(slm_cls)
        w0 = 2*sigma
        l, p = self.order_1, self.order_2

        x, y = slm_cls.x + self.x_shift, slm_cls.y + self.y_shift
        r = np.sqrt(x**2 + y**2)
        phi = np.arctan2(y, x)

        N = np.sqrt(2.0 * factorial(p) / (pi * factorial(p + np.abs(l)))) / w0
        lag = (2**.5 * r / w0)**abs(l) * genlaguerre(p, abs(l))(2 * (r / w0)**2) * np.exp(-(r / w0)**2)
        wf = N * lag * np.exp(-1j * l * phi)
        return wf.astype(complex)



class CGH:
    def __init__(self, sigma: float, quiet=False, slm_cls=_DefaultSLM):
        self.sigma = sigma
        self._mode_list, self._nx_list, self._ny_list = [], [], []
        self.cgh = None

        self._is_quiet = quiet
        self._is_frozen = False
        self._is_cached = False

        self._slm_cls = SLM.check(slm_cls)
        self._cpp_backend = _CppBackend()


    def _check_cgh(self, *args, **kwargs):
        if not self._mode_list:
            raise RuntimeError('No modes added. Use add_modes() to add at least one mode.')
        if self.cgh is None:
            if not self._is_quiet: print('CGH not generated. Running cal() automatically...')
            self.cal(*args, **kwargs)


    def freeze(self):
        self._is_frozen = True
        if not self._is_quiet: print('this CGH instance is now frozen')


    def unfreeze(self):
        self._is_frozen = False
        self._is_cached = False
        if not self._is_quiet: print('this CGH instance is now unfrozen')


    def _check_frozen(self):
        if self._is_frozen:
            raise RuntimeError('this instance is frozen, call `.unfreeze()` before modifying `_mode_list`')


    def add_modes(self, mode_list, nx_list, ny_list):
        self._check_frozen()
        _mode_list = np.atleast_1d(mode_list)
        _nx_list = np.atleast_1d(nx_list)
        _ny_list = np.atleast_1d(ny_list)

        for mode in _mode_list:
            _Mode.check(mode)

        if not (len(_mode_list) == len(_nx_list) == len(_ny_list)):
            raise ValueError('mode_list, nx_list, and ny_list must have the same length')
        
        self._mode_list.extend(_mode_list)
        self._nx_list.extend(_nx_list)
        self._ny_list.extend(_ny_list)


    def clear_modes(self):
        self._check_frozen()
        if not self._is_quiet: print('resetting...')
        self._mode_list, self._nx_list, self._ny_list = [], [], []
        self.cgh = None


    def _cal_V(self):
        V = 0
        for i, mode in enumerate(self._mode_list):
            V = V + (mode.wave_function(self.sigma, self._slm_cls) * 
                     np.exp(2j*pi * (self._slm_cls.norm_x*self._nx_list[i] + self._slm_cls.norm_y*self._ny_list[i])))

        return V


    def cal(self, x_shift_fast=0., y_shift_fast=0., backend='python', algorithm='arrizon', zeta=None, custom_options=None, dump=False):
        custom_options = {} if custom_options is None else custom_options
        self.zeta = -1 if zeta is None else zeta
        if isinstance(algorithm, str):
            self.algo = algorithm.lower()

            if self.algo == 'davis':
                algo_impl = lambda a, phi: _fdavis(a) * phi

            elif self.algo == 'arrizon':
                algo_impl = lambda a, phi: _farrizon(a) * np.sin(phi)

            elif self.algo == 'hybrid':
                if zeta is None:
                    raise ValueError('`zeta` must be provided for hybrid algorithm')
                if zeta < 0 or zeta > 1:
                    raise ValueError('`zeta` must be in [0, 1]')

                zeta_r = np.round(zeta, 2)
                if not np.isclose(zeta, zeta_r):
                    if not self._is_quiet: print(f'warning: zeta={zeta} is rounded to {zeta_r} (step=0.01)') 

                self.zeta = zeta_r
                algo_impl = lambda a, phi: _fhybrid[int(zeta_r * 100)](a) * (zeta_r * phi + (1 - zeta_r) * np.sin(phi))

            else:
                raise ValueError(f'invalid algorithm "{algorithm}", must be one of (davis, arrizon, hybrid) or a callable object')

        elif callable(algorithm):
            algo_impl = algorithm
            self.algo = getattr(algorithm, '__name__', 'custom_callable')

        else:
            raise TypeError('`algorithm` must be a string (built-in) or a callable object (custom)')


        if backend.lower() in ('py', 'python'):
            if not self._is_frozen and (x_shift_fast != 0. or y_shift_fast != 0.):
                raise ValueError('instance must be frozen before using `x_shift_fast` or `y_shift_fast`')
            
            if not self._is_frozen:
                V = self._cal_V()
            
            if self._is_frozen and not self._is_cached:
                V = self._cal_V()
                self.fft = _FFTUtils(self._slm_cls)
                self.cache = self.fft.fft(V)
                self._is_cached = True
            
            if self._is_frozen and self._is_cached:
                V = self.fft.ifft(self.cache * np.exp(2j*pi * (self.fft.norm_x*x_shift_fast + self.fft.norm_y*y_shift_fast)))

            a = np.abs(V) / np.abs(V).max()
            phi = np.angle(V)

            _temp = algo_impl(a, phi, **custom_options)

            _temp = ((_temp - _temp.min()) / (_temp.max() - _temp.min())) * 255

            self.cgh = _temp.astype(np.uint8)
            self.img = Image.fromarray(self.cgh)


        elif backend.lower() in ('c++', 'cpp'):
            if not isinstance(algorithm, str):
                raise TypeError('C++ backend only supports built-in algorithms specified as string')
            
            if self._cpp_backend.is_available:
                self.cgh = self._cpp_backend.cal(self, dump)
                self.img = Image.fromarray(self.cgh)

                if x_shift_fast != 0. or y_shift_fast != 0.:
                    print('C++ backend is enabled, FFT cache is not implemented; `shift_fast` options will be ignored')
            else:
                raise SystemError('C++ engine is not available')

        else:
            raise ValueError('invalid `backend` option')


    def result(self, *args, **kwargs):
        self._check_cgh(*args, **kwargs)
        return self.cgh


    def show(self, *args, **kwargs):
        self._check_cgh(*args, **kwargs)
        self.img.show()


    def save(self, file, override=False, *args, **kwargs):
        self._check_cgh(*args, **kwargs)
        file = path.expanduser(file)
        if not path.exists(file) or override:
            self.img.save(file)
        else:
            raise FileExistsError(f'{file} already exists')


    def __repr__(self):
        lines = [ 
            '\nspadecgh.CGH instance\n',
            '========================= CGH TASK GRAPH =========================',
            f' Sigma: {self.sigma};    Quiet: {self._is_quiet};    Frozen: {self._is_frozen};    Cached: {self._is_cached}',
            '------------------------------------------------------------------',
            ' ID   | (nx, ny)       | Mode(order_1, order_2, x_shift, y_shift)',
            '------------------------------------------------------------------'
        ]
        
        for i, (m, nx, ny) in enumerate(zip(self._mode_list, self._nx_list, self._ny_list)):
            nx_v = nx.item() if hasattr(nx, 'item') else nx
            ny_v = ny.item() if hasattr(ny, 'item') else ny
            
            freq_str = f'({nx_v}, {ny_v})'
            lines.append(f' {i:<4} | {freq_str:<14} | {repr(m)}')
            
        lines.append('==================================================================')
        return '\n'.join(lines)

    def print(self):
        print(self.__repr__())

