#pragma once

#include <json.hpp>

#include "HermiteGaussian.hpp"
#include "LaguerreGaussian.hpp"
#include "common.hpp"
#include "fx2.hpp"

using HG = HermiteGaussian;
using LG = LaguerreGaussian;

int core(const char* json_str, uint8_t* out_buffer) {
  auto j = nlohmann::json::parse(json_str);

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
      hg.broadcast(V, 1.0, nx, ny, res_x, res_y, pixel_size);

    } else if (mode["type"] == "LG") {
      auto lg = LG{mode["o1"], mode["o2"], w0, mode["sx"], mode["sy"]};
      lg.broadcast(V, 1.0, nx, ny, res_x, res_y, pixel_size);

    } else if (mode["type"] == "PM") {
      auto& children = mode["children"];
      size_t n_modes = children["plus"].size() + children["minus"].size();
      if (n_modes == 0) continue;

      double weight = 1.0 / std::sqrt(static_cast<double>(n_modes));
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
    out_buffer[i] = static_cast<uint8_t>((cgh_double[i] - min_val) * inv_range);

  return 0;
}
