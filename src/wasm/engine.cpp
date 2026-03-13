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
using complex = std::complex<double>;
using complex_vector = std::vector<complex>;

const double PI = std::numbers::pi;
const double SQRT2 = std::numbers::sqrt2;
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

class HG
{
private:
  int m_, n_;
  double w0_;

  double w0_sq_;
  double sqrt2_over_w0_;

  double calNorm()
  {
    double fac_n = boost::math::factorial<double>(n_);
    double fac_m = boost::math::factorial<double>(m_);
    return std::sqrt(std::pow(2.0, 1.0 - n_ - m_) / (PI * fac_n * fac_m)) / w0_;
  }

public:
  double norm;

  HG(int n, int m, double w0) : n_(n), m_(m), w0_(w0)
  {
    norm = calNorm();
    w0_sq_ = w0 * w0;
    sqrt2_over_w0_ = SQRT2 / w0;
  }

  complex calHGx(double x)
  {
    double hx = boost::math::hermite(n_, x * sqrt2_over_w0_);
    double wf = hx * std::exp(-(x * x) / w0_sq_);

    return std::polar(std::abs(wf), (wf < 0) ? PI : 0.0);
  }

  complex calHGy(double y)
  {
    double hy = boost::math::hermite(m_, y * sqrt2_over_w0_);
    double wf = hy * std::exp(-(y * y) / w0_sq_);

    return std::polar(std::abs(wf), (wf < 0) ? PI : 0.0);
  }
};

void applyHG(complex_vector &V, HG &hg, double weight, double nx, double ny, int resX, int resY, double pixelSize)
{
  complex_vector wf_x(resX);
  for (int x = 0; x < resX; ++x)
  {
    double px = (x - resX / 2.0) * pixelSize;
    wf_x[x] = hg.calHGx(px) * std::polar(1.0, TAU * (px / (resX * pixelSize)) * nx);
  }

  complex_vector wf_y(resY);
  for (int y = 0; y < resY; ++y)
  {
    double py = -(y - resY / 2.0) * pixelSize;
    wf_y[y] = hg.calHGy(py) * std::polar(1.0, TAU * (py / (resY * pixelSize)) * ny);
  }

  for (int y = 0; y < resY; ++y)
  {
    for (int x = 0; x < resX; ++x)
    {
      V[y * resX + x] += hg.norm * weight * wf_x[x] * wf_y[y];
    }
  }
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

    complex_vector V(totalPixels);

    for (auto &mode : j["modeList"])
    {
      if (mode["type"] == "HG")
      {
        auto stdHG = HG{mode["o1"], mode["o2"], w0};
        applyHG(V, stdHG, 1.0, mode["nx"], mode["ny"], resX, resY, pixelSize);
      }
      else if (mode["type"] == "PM")
      {
        auto subModes = mode["subModes"];
        int N_modes = subModes["plus"].size() + subModes["minus"].size();
        if (N_modes == 0)
          continue;

        double weight = 1.0 / std::sqrt((double)N_modes);
        for (auto &plusModes : subModes["plus"])
        {
          if (plusModes["type"] == "HG")
          {
            auto plusHG = HG{plusModes["o1"], plusModes["o2"], w0};
            applyHG(V, plusHG, weight, mode["nx"], mode["ny"], resX, resY, pixelSize);
          }
        }

        for (auto &minusModes : subModes["minus"])
        {
          if (minusModes["type"] == "HG")
          {
            auto minusHG = HG{minusModes["o1"], minusModes["o2"], w0};
            applyHG(V, minusHG, -weight, mode["nx"], mode["ny"], resX, resY, pixelSize);
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
    for (size_t i = 0; i < totalPixels; ++i)
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

    for (size_t i = 0; i < totalPixels; ++i)
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