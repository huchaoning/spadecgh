#pragma once

#include <json.hpp>
#include <limits>
#include <string>

#include "HermiteGaussian.hpp"
#include "LaguerreGaussian.hpp"
#include "assets/fx0_data.hpp"
#include "assets/fx1_data.hpp"
#include "assets/fx2_data.hpp"
#include "common.hpp"
#include "fx.hpp"

using HG = HermiteGaussian;
using LG = LaguerreGaussian;

int core(const char* json_str, uint8_t* out_buffer) {
  auto j = nlohmann::json::parse(json_str);

  double sigma = j["global"]["sigma"];
  double w0 = 2.0 * sigma;
  double pixel_size = j["global"]["pixel_size"];

  int res_x = j["global"]["resolution"][0];
  int res_y = j["global"]["resolution"][1];
  size_t total_pixels = size_t(res_x) * size_t(res_y);
  std::string algo = j["global"]["algorithm"];

  ComplexVector V(total_pixels, Complex(0.0, 0.0));

  for (auto& mode : j["modes"]) {
    double nx = mode["nx"];
    double ny = mode["ny"];

    if (mode["type"] == "HG") {
      auto hg = HG{mode["o1"], mode["o2"], w0, mode["sx"], mode["sy"]};
      hg.broadcast(V, 1.0, nx, ny, res_x, res_y, pixel_size);

    } else if (mode["type"] == "LG") {
      auto lg = LG{mode["o1"], mode["o2"], w0, mode["sx"], mode["sy"]};
      lg.broadcast(V, 1.0, nx, ny, res_x, res_y, pixel_size);

    } else if (mode["type"] == "PM") {
      auto& children = mode["children"];
      size_t n_modes = children["plus"].size() + children["minus"].size();
      if (n_modes == 0) continue;

      double weight = 1.0 / std::sqrt(double(n_modes));
      for (auto& plus_mode : children["plus"]) {
        if (plus_mode["type"] == "HG") {
          auto hg = HG{plus_mode["o1"], plus_mode["o2"], w0, plus_mode["sx"],
                       plus_mode["sy"]};
          hg.broadcast(V, weight, nx, ny, res_x, res_y, pixel_size);

        } else if (plus_mode["type"] == "LG") {
          auto lg = LG{plus_mode["o1"], plus_mode["o2"], w0, plus_mode["sx"],
                       plus_mode["sy"]};
          lg.broadcast(V, weight, nx, ny, res_x, res_y, pixel_size);
        }
      }

      for (auto& minus_mode : children["minus"]) {
        if (minus_mode["type"] == "HG") {
          auto hg = HG{minus_mode["o1"], minus_mode["o2"], w0, minus_mode["sx"],
                       minus_mode["sy"]};
          hg.broadcast(V, -weight, nx, ny, res_x, res_y, pixel_size);

        } else if (minus_mode["type"] == "LG") {
          auto lg = LG{minus_mode["o1"], minus_mode["o2"], w0, minus_mode["sx"],
                       minus_mode["sy"]};
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
    if (a > max_a) max_a = a;
  }

  if (max_a > 1e-15)
    for (size_t i = 0; i < total_pixels; ++i) A[i] /= max_a;

  DoubleVector cgh(total_pixels);
  double min_val = std::numeric_limits<double>::max();
  double max_val = -std::numeric_limits<double>::max();

#define LOOP(FUNC)                            \
  for (size_t i = 0; i < total_pixels; ++i) { \
    cgh[i] = (FUNC);                          \
    if (cgh[i] < min_val) min_val = cgh[i];   \
    if (cgh[i] > max_val) max_val = cgh[i];   \
  }

  if (algo == "davis") {
    LOOP(fx<fx0_data>(A[i]) * (Phi[i] - TAU * std::floor(Phi[i] / TAU)));
  } else if (algo == "arrizon_1") {
    LOOP(Phi[i] + fx<fx1_data>(A[i]) * std::sin(Phi[i]));
  } else if (algo == "arrizon_2") {
    LOOP(fx<fx2_data>(A[i]) * std::sin(Phi[i]));
  }
#undef LOOP

  double range = max_val - min_val;
  double inv_range = (range > 1e-15) ? (255.0 / range) : 1.0;

  for (size_t i = 0; i < total_pixels; ++i)
    out_buffer[i] = uint8_t((cgh[i] - min_val) * inv_range);

  return 0;
}
