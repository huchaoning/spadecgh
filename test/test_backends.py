import numpy as np
from hducgh import *

def test_backends():
    num_tests = 5
    num_modes = np.random.randint(1, 5)
    algorithms = ['davis', 'arrizon_2']
    
    for algo in algorithms:
        for i in range(num_tests):
            sigma = np.random.uniform(50, 550)
            cgh = CGH(sigma, quiet=True)
            for j in range(num_modes):
                mode = np.random.choice([LG, HG])
                o1 = np.random.randint(-10, 10)
                o1 += 10 if issubclass(mode, HG) else 0
                o2 = np.random.randint(0, 20)

                cgh.add_modes(mode(o1, o2, np.random.normal(0, 160), np.random.normal(0, 90)), np.random.normal(0, 500), np.random.normal(0, 50))

                cgh.cal(algorithm=algo, backend='py')
                data_py = cgh.cgh.copy()

                cgh.cal(algorithm=algo, backend='cpp')
                data_cpp = cgh.cgh.copy()

                diff = data_py.astype(int) - data_cpp.astype(int)
                max_dev = np.max(np.abs(diff))
                
                error_pixels = np.sum(np.abs(diff) > 1)
                error_rate = (error_pixels / data_py.size) * 100

                assert np.allclose(data_cpp, data_py, atol=1), (
                    f"                                                                  \n"
                    f" algorithm: {algo}                                                \n"
                    f"------------------------------------------------------------------\n"
                    f" {repr(cgh)}                                                      \n"
                    f"------------------------------------------------------------------\n"
                    f" max deviation: {max_dev}                                         \n"
                    f" mismatched pixels (diff > 1): {error_pixels} / {data_py.size} ({error_rate:.2f}%)\n"
                    f"==================================================================\n"
                )