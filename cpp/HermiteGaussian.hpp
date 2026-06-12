#pragma once

#include <boost/math/special_functions/factorials.hpp>
#include <boost/math/special_functions/hermite.hpp>

#include "common.hpp"

struct HermiteGaussian {
  int n_, m_;
  double w0_;
  double sx_, sy_;

  double w0_sq_;
  double sqrt2_over_w0_;
  double norm_;

  HermiteGaussian(int n, int m, double w0, double sx, double sy)
      : n_(n), m_(m), w0_(w0), sx_(sx), sy_(sy) {
    norm_ = cal_norm();
    w0_sq_ = w0 * w0;
    sqrt2_over_w0_ = SQRT2 / w0;
  }

  double cal_norm() {
    double fac_n = boost::math::factorial<double>(n_);
    double fac_m = boost::math::factorial<double>(m_);
    return std::sqrt(std::pow(2.0, 1.0 - n_ - m_) / (PI * fac_n * fac_m)) / w0_;
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

  void broadcast(ComplexVector& V, double weight, double nx, double ny,
                 int res_x, int res_y, double pixel_size) {
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
