#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <complex>
#include <algorithm>

// 根据你的路径要求引入 Boost
#include "../../third_party/boost_math/boost/math/special_functions/hermite.hpp"
#include "../../third_party/boost_math/boost/math/special_functions/factorials.hpp"

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "../../third_party/json.hpp"
#include "fx2.hpp"

using json = nlohmann::json;
using namespace emscripten;
using namespace std::complex_literals;

typedef std::complex<double> Complex;
const double PI = 3.14159265358979323846;

// 全局静态缓冲区，用于存储最终传回 JS 的像素数据
std::vector<uint8_t> resultBuffer;

/**
 * 计算单个 HG 模式的复振幅 (对应 Python 中的 HG.wave_function)
 * n, m: 阶数
 * x, y: 物理坐标 (微米)
 * w0: 束腰半径 (2 * sigma)
 */
Complex calc_hg_wf(int n, int m, double x, double y, double w0) {
    double rho2 = x * x + y * y;
    
    // 使用 Boost 计算阶乘 (n! 和 m!)
    double fact_n = boost::math::factorial<double>(n);
    double fact_m = boost::math::factorial<double>(m);
    
    // 归一化系数 N = sqrt(2^(1-n-m) / (pi * n! * m!)) / w0
    double N = std::sqrt(std::pow(2.0, 1.0 - n - m) / (PI * fact_n * fact_m)) / w0;
    
    // 使用 Boost 计算厄米多项式 Hn 和 Hm
    // 注意: Boost 的参数顺序是 (阶数, 自变量)
    double hx = boost::math::hermite(n, std::sqrt(2.0) * x / w0);
    double hy = boost::math::hermite(m, std::sqrt(2.0) * y / w0);
    
    // 高斯包络
    double envelope = std::exp(-rho2 / (w0 * w0));
    
    // 返回复振幅 (Python 中 HG 返回的是 a * exp(1j * phi))
    return Complex(N * hx * hy * envelope, 0.0);
}

/**
 * 主计算函数：接收前端传来的 JSON 配置，生成全息图像素数组
 */
val generateCGH(std::string jsonStr) {
    try {
        auto data = json::parse(jsonStr);
        
        // 1. 基础参数提取
        int width = data["global"]["resolution"][0];
        int height = data["global"]["resolution"][1];
        double sigma = data["global"]["sigma"];
        double pixelSize = data["global"]["pixelSize"];
        double w0 = 2.0 * sigma;

        // 2. 初始化复振幅累加矩阵 V
        std::vector<Complex> V(width * height, 0.0);

        // 3. 遍历模式列表进行叠加
        for (auto& modeItem : data["modeList"]) {
            int n = modeItem["n"];
            int m = modeItem["m"];
            double nx = modeItem["nx"];
            double ny = modeItem["ny"];
            // 如果你以后加了 x_shift/y_shift，记得在这里提取并加到下面的 x_phys/y_phys 中

            for (int j = 0; j < height; ++j) {
                // y 轴物理坐标：对应 Python 的 -np.arange(...) * pixel_size
                double y_phys = -(j - height / 2.0) * pixelSize;
                // y 轴归一化坐标：对应 SLM.norm_y
                double norm_y = (double)j / height - 0.5;

                for (int i = 0; i < width; ++i) {
                    // x 轴物理坐标
                    double x_phys = (i - width / 2.0) * pixelSize;
                    // x 轴归一化坐标：对应 SLM.norm_x
                    double norm_x = (double)i / width - 0.5;

                    // 计算当前点的模式波函数
                    Complex wf = calc_hg_wf(n, m, x_phys, y_phys, w0);
                    
                    // 计算载波相位相位：exp(2j * pi * (norm_x * nx + norm_y * ny))
                    double phase = 2.0 * PI * (norm_x * nx + norm_y * ny);
                    
                    // 叠加到总场 V = V + wf * carrier
                    V[j * width + i] += wf * std::polar(1.0, phase);
                }
            }
        }

        // 4. 归一化振幅 a
        double max_abs_v = 0.0;
        for (const auto& v : V) {
            max_abs_v = std::max(max_abs_v, std::abs(v));
        }
        if (max_abs_v == 0) max_abs_v = 1.0;

        // 5. 应用 Arrizon 公式与 fx2 查找表映射
        if (resultBuffer.size() != width * height) {
            resultBuffer.resize(width * height);
        }

        for (int i = 0; i < (int)V.size(); ++i) {
            double a = std::abs(V[i]) / max_abs_v;
            double phi = std::arg(V[i]);

            // 从 fx2.hpp (CGH 命名空间) 获取修正后的振幅
            // 注意：这里假设你的 fx2.hpp 提供了 CGH::get_fx2(double a)
            double corrected_a = CGH::get_fx2(a); 
            
            // 计算中间值：_temp = fx2(a) * sin(phi)
            double temp = corrected_a * std::sin(phi);
            
            // 6. 映射到 0-255 像素值
            // Python 逻辑是 (temp - min) / (max - min) * 255
            // 如果 corrected_a 的量程是 0-1，则 temp 范围是 [-1, 1]
            // 如果 corrected_a 的量程是 0-255，则 temp 范围是 [-255, 255]
            // 这里假设你的 fx2 数据已经缩放到了 0-1 范围：
            double pixel_val = (temp + 1.0) * 127.5; 
            
            resultBuffer[i] = static_cast<uint8_t>(std::clamp(pixel_val, 0.0, 255.0));
        }

        // 返回内存视图，JS 直接读取
        return val(typed_memory_view(resultBuffer.size(), resultBuffer.data()));

    } catch (std::exception& e) {
        std::cerr << "C++ Engine Error: " << e.what() << std::endl;
        return val::null();
    }
}

// 绑定导出
EMSCRIPTEN_BINDINGS(cgh_wasm_engine) {
    function("generateCGH", &generateCGH);
}