from .core import _Mode, CGH


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



def serialize(inputs):
    if isinstance(inputs, _Mode):
        return _serialize_mode(inputs)
    
    if isinstance(inputs, CGH):
        return _serialize_cgh(inputs)
