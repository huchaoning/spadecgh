#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <complex>
#include <algorithm>
#include <numbers>

#include "../../third_party/boost_math/boost/math/special_functions/hermite.hpp"
#include "../../third_party/boost_math/boost/math/special_functions/factorials.hpp"
#include "../../third_party/json.hpp"
#include "fx2.hpp"

using json = nlohmann::json;
using namespace emscripten;

const double PI = std::numbers::pi;
const double SQRT_2 = std::sqrt(2);
const double TAU = 2.0 * std::numbers::pi;

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

double cal_hg_norm(int n, int m, double w0, int N_modes)
{
  double fac_n = boost::math::factorial<double>(n);
  double fac_m = boost::math::factorial<double>(m);

  return std::sqrt(std::pow(2.0, 1.0 - n - m) / (PI * fac_n * fac_m)) / w0 / std::sqrt(N_modes);
}

std::complex<double> cal_hg(int n, int m, double x, double y, double w0, double norm)
{
  double rho_sq = x * x + y * y;
  double w0_sq = w0 * w0;

  double sqrt2_over_w0 = SQRT_2 / w0;
  double hx = boost::math::hermite(n, x * sqrt2_over_w0);
  double hy = boost::math::hermite(m, y * sqrt2_over_w0);

  double wf = norm * hx * hy * std::exp(-rho_sq / w0_sq);

  return std::polar(std::abs(wf), (wf < 0) ? PI : 0.0);
}

val generateCGH(std::string json_str)
{
  try
  {
    auto j = json::parse(json_str);

    double sigma = j["global"]["sigma"];
    double w0 = 2.0 * sigma;

    double pixelSize = j["global"]["pixelSize"];
    int resX = j["global"]["resolution"][0];
    int resY = j["global"]["resolution"][1];
    size_t totalPixels = resX * resY;

    std::vector<std::complex<double>> V(totalPixels);

    for (auto &mode : j["modeList"])
    {
      if (mode["type"] == "HG")
      {
        int n = mode["n"];
        int m = mode["m"];
        double nx = mode["nx"];
        double ny = mode["ny"];
        double norm = cal_hg_norm(n, m, w0, 1);

        for (int y = 0; y < resY; ++y)
        {
          for (int x = 0; x < resX; ++x)
          {
            double px = (x - resX / 2.0) * pixelSize;
            double py = -(y - resY / 2.0) * pixelSize;

            double norm_x = px / (resX * pixelSize);
            double norm_y = py / (resY * pixelSize);

            std::complex<double> wf = cal_hg(n, m, px, py, w0, norm);
            V[y * resX + x] += wf * std::polar(1.0, TAU * (norm_x * nx + norm_y * ny));
          }
        }
      }
    }

    std::vector<double> A(totalPixels);
    std::vector<double> Phi(totalPixels);
    std::transform(V.begin(), V.end(), A.begin(), [](const auto &v)
                   { return std::abs(v); });
    std::transform(V.begin(), V.end(), Phi.begin(), [](const auto &v)
                   { return std::arg(v); });
    double maxA = *std::max_element(A.begin(), A.end());
    if (maxA < 1e-15)
      maxA = 1.0;
    std::for_each(A.begin(), A.end(), [maxA](double &a)
                  { a /= maxA; });

    std::vector<double> cgh_val(totalPixels);
    double min_val = 1e15, max_val = -1e15;
    for (size_t i = 0; i < totalPixels; i++)
    {
      cgh_val[i] = fx2(A[i]) * std::sin(Phi[i]);

      if (cgh_val[i] < min_val)
        min_val = cgh_val[i];
      if (cgh_val[i] > max_val)
        max_val = cgh_val[i];
    }

    double range = max_val - min_val;
    if (range < 1e-15)
      range = 1.0;

    for (size_t i = 0; i < totalPixels; i++)
    {
      cgh_val[i] = static_cast<uint8_t>(((cgh_val[i] - min_val) / range) * 255.0);
    }

    return val(typed_memory_view(cgh_val.size(), cgh_val.data()));
  }

  catch (const std::exception &e)
  {
    std::cerr << "Error: " << e.what() << std::endl;
    return val::null();
  }
}

EMSCRIPTEN_BINDINGS(cgh_engine)
{
  function("generateCGH", &generateCGH);
}