#pragma once

#include <json.hpp>
#include <limits>
#include <string>

#include "HermiteGaussian.hpp"
#include "LaguerreGaussian.hpp"
#include "assets/farrizon_uint16.hpp"
#include "assets/fdavis_uint16.hpp"
#include "assets/fhybrid_uint16.hpp"
#include "common.hpp"
#include "fx.hpp"

using HG = HermiteGaussian;
using LG = LaguerreGaussian;

double davis_impl(double a, double phi) { return fx<fdavis_uint16>(a) * phi; }

double arrizon_impl(double a, double phi) {
  return fx<farrizon_uint16>(a) * std::sin(phi);
}

double hybrid_impl(double a, double phi, double zeta) {
  return fx2d<fhybrid_uint16>(a, zeta) *
         (zeta * phi + (1.0 - zeta) * std::sin(phi));
}

#define ALGO_LOOP(ALGO_IMPL, ...)                        \
  for (size_t i = 0; i < total_pixels; ++i) {            \
    double val = ALGO_IMPL(A[i], Phi[i], ##__VA_ARGS__); \
    cgh[i] = val;                                        \
    min_val = std::min(min_val, val);                    \
    max_val = std::max(max_val, val);                    \
  }

#define TOTAL_SHIFT(CHILD_MODE)              \
  const double& child_sx = CHILD_MODE["sx"]; \
  const double& child_sy = CHILD_MODE["sy"]; \
  double total_sx = sx + child_sx;           \
  double total_sy = sy + child_sy;

int core(const char* json_str, uint8_t* out_buffer) {
  auto j = nlohmann::json::parse(json_str);

  double sigma = j["global"]["sigma"];
  double w0 = 2.0 * sigma;
  double pixel_size = j["global"]["pixel_size"];

  int res_x = j["global"]["resolution"][0];
  int res_y = j["global"]["resolution"][1];
  size_t total_pixels = size_t(res_x) * size_t(res_y);
  std::string algo = j["global"]["algorithm"];
  double zeta = j["global"]["zeta"];

  ComplexVector V(total_pixels, Complex(0.0, 0.0));

  for (const auto& mode : j["modes"]) {
    const double& nx = mode["nx"];
    const double& ny = mode["ny"];

    if (mode["type"] == "HG") {
      auto hg = HG{mode["o1"], mode["o2"], w0, mode["sx"], mode["sy"]};
      hg.broadcast(V, 1.0, nx, ny, res_x, res_y, pixel_size);

    } else if (mode["type"] == "LG") {
      auto lg = LG{mode["o1"], mode["o2"], w0, mode["sx"], mode["sy"]};
      lg.broadcast(V, 1.0, nx, ny, res_x, res_y, pixel_size);

    } else if (mode["type"] == "PM") {
      const double& sx = mode["sx"];
      const double& sy = mode["sy"];
      const auto& children = mode["children"];
      size_t n_modes = children["plus"].size() + children["minus"].size();
      if (n_modes == 0) continue;

      double weight = 1.0 / std::sqrt(double(n_modes));
      for (const auto& plus_mode : children["plus"]) {
        TOTAL_SHIFT(plus_mode)
        if (plus_mode["type"] == "HG") {
          auto hg =
              HG{plus_mode["o1"], plus_mode["o2"], w0, total_sx, total_sy};
          hg.broadcast(V, weight, nx, ny, res_x, res_y, pixel_size);

        } else if (plus_mode["type"] == "LG") {
          auto lg =
              LG{plus_mode["o1"], plus_mode["o2"], w0, total_sx, total_sy};
          lg.broadcast(V, weight, nx, ny, res_x, res_y, pixel_size);
        }
      }

      for (const auto& minus_mode : children["minus"]) {
        TOTAL_SHIFT(minus_mode)
        if (minus_mode["type"] == "HG") {
          auto hg =
              HG{minus_mode["o1"], minus_mode["o2"], w0, total_sx, total_sy};
          hg.broadcast(V, -weight, nx, ny, res_x, res_y, pixel_size);

        } else if (minus_mode["type"] == "LG") {
          auto lg =
              LG{minus_mode["o1"], minus_mode["o2"], w0, total_sx, total_sy};
          lg.broadcast(V, -weight, nx, ny, res_x, res_y, pixel_size);
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
    max_a = std::max(max_a, a);
  }

  if (max_a > 1e-15)
    for (size_t i = 0; i < total_pixels; ++i) A[i] /= max_a;

  DoubleVector& cgh = A;  // reuse memory
  double min_val = std::numeric_limits<double>::max();
  double max_val = -std::numeric_limits<double>::max();

  if (algo == "davis") {
    ALGO_LOOP(davis_impl);
  } else if (algo == "arrizon") {
    ALGO_LOOP(arrizon_impl);
  } else if (algo == "hybrid") {
    ALGO_LOOP(hybrid_impl, zeta);
  }

  double range = max_val - min_val;
  double inv_range = (range > 1e-15) ? (255.0 / range) : 1.0;

  for (size_t i = 0; i < total_pixels; ++i)
    out_buffer[i] = uint8_t((cgh[i] - min_val) * inv_range);

  return 0;
}

#undef ALGO_LOOP
#undef TOTAL_SHIFT
