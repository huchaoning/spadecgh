#include <algorithm>
#include <cmath>
#include <complex>
#include <iostream>
#include <numbers>
#include <string>
#include <vector>

#include "fx2.hpp"
#include "third_party/boost_math/boost/math/special_functions/factorials.hpp"
#include "third_party/boost_math/boost/math/special_functions/hermite.hpp"
#include "third_party/nlohmann_json/json.hpp"

using json = nlohmann::json;

using Complex = std::complex<double>;
using ComplexVector = std::vector<Complex>;
using DoubleVector = std::vector<double>;

constexpr double PI = std::numbers::pi;
constexpr double SQRT2 = std::numbers::sqrt2;
constexpr double TAU = 2.0 * std::numbers::pi;

double fx2(double x) {
  double pos = x * 800.0;
  int i = static_cast<int>(pos);
  if (i >= 800) return fx2_data[800];
  if (i < 0) return fx2_data[0];
  double t = pos - i;
  return fx2_data[i] * (1.0 - t) + fx2_data[i + 1] * t;
}

class HG {
 private:
  int n_, m_;
  double w0_;
  double sx_, sy_;

  double w0_sq_;
  double sqrt2_over_w0_;
  double norm_;

  double cal_norm() {
    double fac_n = boost::math::factorial<double>(n_);
    double fac_m = boost::math::factorial<double>(m_);
    return std::sqrt(std::pow(2.0, 1.0 - n_ - m_) / (PI * fac_n * fac_m)) / w0_;
  }

 public:
  HG(int n, int m, double w0, double sx, double sy)
      : n_(n), m_(m), w0_(w0), sx_(sx), sy_(sy) {
    norm_ = cal_norm();
    w0_sq_ = w0 * w0;
    sqrt2_over_w0_ = SQRT2 / w0;
  }

  Complex cal_wf_x(double x) {
    double hx = boost::math::hermite(n_, x * sqrt2_over_w0_);
    double wf = hx * std::exp(-(x * x) / w0_sq_);
    return std::polar(std::abs(wf), (wf < 0) ? PI : 0.0);
  }

  Complex cal_wf_y(double y) {
    double hy = boost::math::hermite(m_, y * sqrt2_over_w0_);
    double wf = hy * std::exp(-(y * y) / w0_sq_);
    return std::polar(std::abs(wf), (wf < 0) ? PI : 0.0);
  }

  void apply(ComplexVector& V, double weight, double nx, double ny, int res_x,
             int res_y, double pixel_size) {
    ComplexVector wf_x(res_x);
    for (int x = 0; x < res_x; ++x) {
      double x_um = (x - res_x / 2.0) * pixel_size;
      wf_x[x] = cal_wf_x(x_um + sx_) *
                std::polar(1.0, TAU * (x_um / (res_x * pixel_size)) * nx);
    }

    ComplexVector wf_y(res_y);
    for (int y = 0; y < res_y; ++y) {
      double y_um = -(y - res_y / 2.0) * pixel_size;
      wf_y[y] = cal_wf_y(y_um + sy_) *
                std::polar(1.0, TAU * (y_um / (res_y * pixel_size)) * ny);
    }

    for (int y = 0; y < res_y; ++y) {
      for (int x = 0; x < res_x; ++x) {
        V[y * res_x + x] += norm_ * weight * wf_x[x] * wf_y[y];
      }
    }
  }
};

#ifdef _WIN32
  #define API_EXPORT __declspec(dllexport)
#else
  #define API_EXPORT
#endif

extern "C" {
API_EXPORT int cal(const char* json_str, uint8_t* out_buffer) {
  if (!json_str || !out_buffer) return -1;

  try {
    auto j = json::parse(json_str);

    double sigma = j["global"]["sigma"];
    double w0 = 2.0 * sigma;
    double pixel_size = j["global"]["pixel_size"];
    int res_x = j["global"]["resolution"][0];
    int res_y = j["global"]["resolution"][1];
    size_t total_pixels = static_cast<size_t>(res_x) * res_y;

    ComplexVector V(total_pixels, Complex(0.0, 0.0));

    for (auto& mode : j["modes"]) {
      double nx = mode["nx"];
      double ny = mode["ny"];

      if (mode["type"] == "HG") {
        auto hg = HG{mode["o1"], mode["o2"], w0, mode["sx"], mode["sy"]};
        hg.apply(V, 1.0, nx, ny, res_x, res_y, pixel_size);
      } else if (mode["type"] == "PM") {
        auto& children = mode["children"];
        size_t n_modes = children["plus"].size() + children["minus"].size();
        if (n_modes == 0) continue;

        double weight = 1.0 / std::sqrt(static_cast<double>(n_modes));

        for (auto& plus_mode : children["plus"]) {
          if (plus_mode["type"] == "HG") {
            auto hg = HG{plus_mode["o1"], plus_mode["o2"], w0, plus_mode["sx"],
                         plus_mode["sy"]};
            hg.apply(V, weight, nx, ny, res_x, res_y, pixel_size);
          }
        }

        for (auto& minus_mode : children["minus"]) {
          if (minus_mode["type"] == "HG") {
            auto hg = HG{minus_mode["o1"], minus_mode["o2"], w0,
                         minus_mode["sx"], minus_mode["sy"]};
            hg.apply(V, -weight, nx, ny, res_x, res_y, pixel_size);
          }
        }
      }
    }

    DoubleVector A(total_pixels);
    DoubleVector Phi(total_pixels);
    double max_a = -1.0;

    for (size_t i = 0; i < total_pixels; ++i) {
      double a = std::abs(V[i]);
      A[i] = a;
      Phi[i] = std::arg(V[i]);
      if (a > max_a) max_a = a;
    }

    if (max_a > 1e-15)
      for (size_t i = 0; i < total_pixels; ++i) A[i] /= max_a;

    DoubleVector cgh_double(total_pixels);
    double min_val = 1e15;
    double max_val = -1e15;

    for (size_t i = 0; i < total_pixels; ++i) {
      cgh_double[i] = fx2(A[i]) * std::sin(Phi[i]);
      if (cgh_double[i] < min_val) min_val = cgh_double[i];
      if (cgh_double[i] > max_val) max_val = cgh_double[i];
    }

    double range = max_val - min_val;
    double inv_range = (range > 1e-15) ? (255.0 / range) : 1.0;

    for (size_t i = 0; i < total_pixels; ++i)
      out_buffer[i] =
          static_cast<uint8_t>((cgh_double[i] - min_val) * inv_range);

    return 0;
  } catch (const std::exception& e) {
    std::cerr << "C++ engine error: " << e.what() << std::endl;
    return 1;
  }
}
}
