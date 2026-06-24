import os
import json
import platform
from cffi import FFI
import numpy as np

from importlib import resources


class _CppBackend:
    _ffi = FFI()
    _ffi.cdef('int cal(const char* json_str, unsigned char* out_buffer);')

    def __init__(self):
        self._lib = self._load_library()

    def _load_library(self):
        system_type = platform.system()

        if system_type.lower() == "darwin":
            lib_name = "hducgh_backend_macos_universal.dylib"
        elif system_type.lower() == "linux":
            lib_name = "hducgh_backend_linux_x64.so"
        elif system_type.lower() == "windows":
            lib_name = "hducgh_backend_win_x64.dll"
        else:
            return None

        lib_resource = resources.files('hducgh.assets').joinpath(lib_name)
        with resources.as_file(lib_resource) as lib_path:
            if not lib_path.exists():
                return None
            return self._ffi.dlopen(str(lib_path))

    @property
    def is_available(self):
        return self._lib is not None

    def cal(self, cgh_instance, dump=False):
        if self._lib == None:
            raise RuntimeError('C++ library is not loaded')

        ir_dict = _serialize_cgh(cgh_instance)

        if dump:
            print('C++ payload: ' + json.dumps(ir_dict, indent=2))

        json_bytes = json.dumps(ir_dict).encode('utf-8')

        res_x, res_y = ir_dict['global']['resolution']
        cgh_array = np.zeros((res_y, res_x), dtype=np.uint8)

        out_ptr = self._ffi.cast('unsigned char*', self._ffi.from_buffer(cgh_array))

        status = self._lib.cal(json_bytes, out_ptr)
        if status != 0:
            raise RuntimeError('C++ engine error')

        return cgh_array


def _serialize_mode(mode):
    if not mode.is_leaf:
        plus, minus = mode.flatten()
        return {
            'type': 'PM',
            'children': {
                'plus': [_serialize_mode(m) for m in plus],
                'minus': [_serialize_mode(m) for m in minus],
            }
        }

    elif mode.is_leaf:
        return {
            'type': mode.__class__.__name__,
            'o1': mode.order_1,
            'o2': mode.order_2,
            'sx': float(mode.x_shift),
            'sy': float(mode.y_shift),
        }


def _serialize_cgh(cgh):
    data = {
        'global': {
            'sigma': float(cgh.sigma),
            'pixel_size': float(cgh._slm_cls.pixel_size),
            'resolution': list(cgh._slm_cls.resolution),
            'algorithm': str(cgh.algo),
            'zeta': float(cgh.zeta)
        },
        'modes': []
    }

    for mode, nx, ny in zip(cgh._mode_list, cgh._nx_list, cgh._ny_list):
        mode_json = _serialize_mode(mode)
        mode_json['nx'] = float(nx)
        mode_json['ny'] = float(ny)
        data['modes'].append(mode_json)
    return data
