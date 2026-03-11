#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <complex>
#include <algorithm>

#include "../../third_party/boost_math/boost/math/special_functions/hermite.hpp"
#include "../../third_party/boost_math/boost/math/special_functions/factorials.hpp"
#include "../../third_party/json.hpp"
#include "fx2.hpp"

using json = nlohmann::json;
using namespace emscripten;

typedef std::complex<double> Complex;
const double PI = 3.14159265358979323846;

// --- 静态全局缓冲区，避免函数内申请大内存导致崩溃 ---
std::vector<uint8_t> resultBuffer;
std::vector<Complex> V_buffer;
std::vector<double> temp_map;

// Arrizon 2 查找表插值
double fx2(double x)
{
  double pos = x * 800.0;
  int i = static_cast<int>(pos);
  if (i >= 800)
    return fx2_data[800];
  if (i < 0)
    return fx2_data[0];
  double t = pos - i;
  return fx2_data[i] * (1.0 - t) + fx2_data[i + 1] * t;
}

// 单点 HG 计算
Complex calculate_hg(int n, int m, double x, double y, double sigma)
{
  double w0 = 2.0 * sigma;
  double rho_sq = x * x + y * y;
  double w0_sq = w0 * w0;

  double fac_n = boost::math::factorial<double>(n);
  double fac_m = boost::math::factorial<double>(m);

  // 归一化常数
  double N = std::sqrt(std::pow(2.0, 1.0 - n - m) / (PI * fac_n * fac_m)) / w0;

  double sqrt2_over_w0 = 1.414213562373095 / w0;
  double hx = boost::math::hermite(n, x * sqrt2_over_w0);
  double hy = boost::math::hermite(m, y * sqrt2_over_w0);

  double ca = N * hx * hy * std::exp(-rho_sq / w0_sq);

  // 返回复数：幅度 + 相位(取决于符号)
  return std::polar(std::abs(ca), (ca < 0) ? PI : 0.0);
}

val generateCGH(std::string json_str)
{
  try
  {
    auto j = json::parse(json_str);

    // 1. 获取参数
    double sigma = j["global"]["sigma"];
    double pixelSize = j["global"]["pixelSize"];
    int resX = j["global"]["resolution"][0];
    int resY = j["global"]["resolution"][1];
    uint32_t totalPixels = resX * resY;

    // 2. 确保所有缓冲区大小正确
    if (resultBuffer.size() != totalPixels)
      resultBuffer.resize(totalPixels);
    if (V_buffer.size() != totalPixels)
      V_buffer.resize(totalPixels);
    if (temp_map.size() != totalPixels)
      temp_map.resize(totalPixels);

    // 重置复数场
    std::fill(V_buffer.begin(), V_buffer.end(), Complex(0, 0));

    // 3. 物理场叠加
    for (auto &mode : j["modeList"])
    {
      if (mode["type"] == "HG")
      {
        int n = mode["n"];
        int m = mode["m"];
        double nx = mode["nx"];
        double ny = mode["ny"];

        for (int y = 0; y < resY; ++y)
        {
          for (int x = 0; x < resX; ++x)
          {
            // 物理坐标映射 (中心对称)
            double px = (x - resX / 2.0) * pixelSize;
            double py = -(y - resY / 2.0) * pixelSize;

            // 归一化坐标计算载波
            double norm_x = px / (resX * pixelSize);
            double norm_y = py / (resY * pixelSize);

            Complex wf = calculate_hg(n, m, px, py, sigma);
            double carrier_phi = 2.0 * PI * (norm_x * nx + norm_y * ny);

            V_buffer[y * resX + x] += wf * std::polar(1.0, carrier_phi);
          }
        }
      }
    }

    // 4. 振幅归一化
    double maxA = 0.0;
    for (uint32_t i = 0; i < totalPixels; ++i)
    {
      maxA = std::max(maxA, std::abs(V_buffer[i]));
    }
    if (maxA < 1e-15)
      maxA = 1.0;

    // 5. Arrizon 2 渲染 (计算中间值并找 min/max)
    double min_v = 1e15, max_v = -1e15;
    for (uint32_t i = 0; i < totalPixels; ++i)
    {
      double a = std::abs(V_buffer[i]) / maxA;
      double phi = std::arg(V_buffer[i]);

      double val_tmp = fx2(a) * std::sin(phi);
      temp_map[i] = val_tmp;

      if (val_tmp < min_v)
        min_v = val_tmp;
      if (val_tmp > max_v)
        max_v = val_tmp;
    }

    // 6. 最终线性映射到 resultBuffer
    double range = max_v - min_v;
    if (range < 1e-15)
      range = 1.0;

    for (uint32_t i = 0; i < totalPixels; ++i)
    {
      resultBuffer[i] = static_cast<uint8_t>(((temp_map[i] - min_v) / range) * 255.0);
    }

    // 7. 返回零拷贝内存视图
    return val(typed_memory_view(resultBuffer.size(), resultBuffer.data()));
  }
  catch (const std::exception &e)
  {
    std::cerr << "C++ Error: " << e.what() << std::endl;
    return val::null();
  }
}

EMSCRIPTEN_BINDINGS(cgh_engine)
{
  function("generateCGH", &generateCGH);
}