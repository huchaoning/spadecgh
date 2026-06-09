import os
import json
import platform
from cffi import FFI
import numpy as np

from importlib.resources import files


class CGHEngineCPP:
    _ffi = FFI()
    _ffi.cdef('int cal(const char* json_str, unsigned char* out_buffer);')

    def __init__(self):
        self._lib = self._load_library()

    def _load_library(self):
        system_type = platform.system()

        if system_type == "Darwin":
            lib_name = "cgh_engine.dylib"
        elif system_type == "Linux":
            lib_name = "cgh_engine.so"
        elif system_type == "Windows":
            lib_name = "cgh_engine.dll"
        else:
            return None

        lib_package = files('hduq.cnhu.cgh.lib')
        with lib_package.joinpath(lib_name) as lib_path:
            if not lib_path.exists():
                return None
            return self._ffi.dlopen(str(lib_path))

    @property
    def is_available(self):
        return self._lib is not None

    def compute(self, cgh_instance):
        if self._lib == None:
            raise RuntimeError('C++ library is not loaded')

        ir_dict = _serialize_cgh(cgh_instance)
        json_bytes = json.dumps(ir_dict).encode('utf-8')

        res_x, res_y = ir_dict['global']['resolution']
        cgh_array = np.zeros((res_y, res_x), dtype=np.uint8)

        out_ptr = self._ffi.cast(
            'unsigned char*', self._ffi.from_buffer(cgh_array))

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
            'pixel_size': float(cgh.slm_cls.pixel_size),
            'resolution': list(cgh.slm_cls.resolution),
        },
        'modes': []
    }

    for mode, nx, ny in zip(cgh.mode_list, cgh.nx_list, cgh.ny_list):
        mode_json = _serialize_mode(mode)
        mode_json['nx'] = float(nx)
        mode_json['ny'] = float(ny)
        data['modes'].append(mode_json)
    return data
