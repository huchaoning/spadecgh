#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <complex>
#include <vector>
#include <cmath>
#include <algorithm>
#include <boost/math/special_functions/hermite.hpp>
#include <boost/math/special_functions/factorials.hpp>
#include "fx2.h" 

using namespace emscripten;
using std::complex;
using std::polar;


class CGH {
private:
    const double* fx2_ptr;
    size_t fx2_count;

public:
    CGH() {
        fx2_ptr = reinterpret_cast<const double*>(ACTUAL_DATA_VAR);
        fx2_count = ACTUAL_LEN_VAR / sizeof(double);
    }

    double fx2_interp(double x) {
        if (x <= 0.0) return fx2_ptr[0];
        if (x >= 1.0) return fx2_ptr[fx2_count - 1];
        double pos = x * (static_cast<double>(fx2_count) - 1.0);
        int idx = static_cast<int>(pos);
        double weight = pos - idx;
        return fx2_ptr[idx] * (1.0 - weight) + fx2_ptr[idx + 1] * weight;
    }

    val cal(int res_x, int res_y, double pixel_size, double sigma, int n, int m, double nx, double ny) {
        double w0 = 2.0 * sigma;
        int total = res_x * res_y;
        
        std::vector<complex<double>> V(total);
        std::vector<double> abs_V(total);
        double max_abs_V = 0.0;

        double norm_factor = std::sqrt(std::pow(2.0, 1.0 - n - m) / 
                             (M_PI * boost::math::factorial<double>(n) * boost::math::factorial<double>(m))) / w0;

        for (int j = 0; j < res_y; j++) {
            double y_phys = (res_y / 2.0 - static_cast<double>(j)) * pixel_size;
            double norm_y = y_phys / (static_cast<double>(res_y) * pixel_size);

            for (int i = 0; i < res_x; i++) {
                double x_phys = (static_cast<double>(i) - res_x / 2.0) * pixel_size;
                double norm_x = x_phys / (static_cast<double>(res_x) * pixel_size);

                double hx = boost::math::hermite(n, std::sqrt(2.0) * x_phys / w0);
                double hy = boost::math::hermite(m, std::sqrt(2.0) * y_phys / w0);
                double rho_sq = x_phys * x_phys + y_phys * y_phys;
                
                // --- 物理逻辑修正开始 ---
                // 1. 计算包含符号的原始实振幅
                double raw_amp = norm_factor * hx * hy * std::exp(-rho_sq / (w0 * w0));
                
                // 2. 振幅必须非负，负号转为 PI 的初相位
                double a_val = std::abs(raw_amp);
                double initial_phi = (raw_amp < 0) ? M_PI : 0.0;
                
                // 3. 叠加 Tilt 相位
                double tilt_phase = 2.0 * M_PI * (norm_x * nx + norm_y * ny);
                double total_phi = initial_phi + tilt_phase;
                // --- 物理逻辑修正结束 ---

                int idx = j * res_x + i;
                V[idx] = std::polar(a_val, total_phi);
                abs_V[idx] = a_val;
                
                if (a_val > max_abs_V) max_abs_V = a_val;
            }
        }

        std::vector<double> temp(total);
        double t_min = 1e10, t_max = -1e10;
        if (max_abs_V == 0) max_abs_V = 1.0;

        for (int k = 0; k < total; k++) {
            double a = abs_V[k] / max_abs_V; // 归一化振幅 [0, 1]
            double phi = std::arg(V[k]);     // 获取相位 [-PI, PI]
            
            // 计算干涉项
            temp[k] = fx2_interp(a) * std::sin(phi);
            
            if (temp[k] < t_min) t_min = temp[k];
            if (temp[k] > t_max) t_max = temp[k];
        }

        // 最终归一化到 [0, 255]
        std::vector<uint8_t> result(total);
        double range = t_max - t_min;
        if (range < 1e-15) range = 1.0;

        for (int k = 0; k < total; k++) {
            result[k] = static_cast<uint8_t>((temp[k] - t_min) / range * 255.0);
        }

        return val(typed_memory_view(result.size(), result.data()));
    }
};

EMSCRIPTEN_BINDINGS(cgh_engine) {
    class_<CGH>("CGH")
        .constructor()
        .function("cal", &CGH::cal);
}