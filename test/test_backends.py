import numpy as np
import logging
from spadecgh import *

def test_backends():
    num_tests = 20
    atol = 1
    num_modes = np.random.randint(1, 5)
    algorithms = ['davis', 'arrizon', 'hybrid']
    
    for algo in algorithms:
        for i in range(num_tests):
            sigma = np.random.uniform(50, 550)
            cgh = CGH(sigma, quiet=True)
            for j in range(num_modes):
                mode = np.random.choice([LG, HG])
                o1 = np.random.randint(-10, 10)
                o1 += 10 if issubclass(mode, HG) else 0
                o2 = np.random.randint(0, 20)
                zeta = np.random.uniform(0, 1)

                cgh.add_modes(mode(o1, o2, np.random.normal(0, 160), np.random.normal(0, 90)), np.random.normal(0, 500), np.random.normal(0, 50))

                cgh.cal(algorithm=algo, backend='py', zeta=zeta)
                data_py = cgh.cgh.astype(float).copy()

                cgh.cal(algorithm=algo, backend='cpp', zeta=zeta)
                data_cpp = cgh.cgh.astype(float).copy()

                diff = np.abs(data_py - data_cpp)
                max_dev = np.max(diff)

                error_pixels = np.sum(diff > 0)
                error_rate = (error_pixels / data_py.size) * 100
                mismatched_pixels = f'mismatched pixels: {error_pixels} / {data_py.size} ({error_rate:.2f}%)'
                is_passed = bool(np.allclose(data_cpp, data_py, atol=atol))

                logging.info(f'algo {algo}; loop {i} ({j}): {mismatched_pixels}, passed (max deviation = {int(max_dev)})')
                assert is_passed, (
                    f'======================= YOU SHALL NOT PASS =======================\n'
                    f' algorithm: {algo}; zeta: {zeta}                                  \n'
                    f'------------------------------------------------------------------\n'
                    f' {repr(cgh)}                                                      \n'
                    f'------------------------------------------------------------------\n'
                    f' max deviation: {int(max_dev)}                                         \n'
                    f' {mismatched_pixels}                                              \n'
                    f'==================================================================\n'
                )
