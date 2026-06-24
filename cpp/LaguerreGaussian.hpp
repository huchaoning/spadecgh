#pragma once

#include <boost/math/special_functions/factorials.hpp>
#include <boost/math/special_functions/laguerre.hpp>

#include "common.hpp"

struct LaguerreGaussian {
  int p_, l_;
  double w0_;
  double sx_, sy_;

  double w0_sq_;
  double sqrt2_over_w0_;
  double norm_;

  LaguerreGaussian(int l, int p, double w0, double sx, double sy)
      : l_(l), p_(p), w0_(w0), sx_(sx), sy_(sy) {
    norm_ = cal_norm();
    w0_sq_ = w0 * w0;
    sqrt2_over_w0_ = SQRT2 / w0;
  }

  double cal_norm() {
    double fac_p = boost::math::factorial<double>(p_);
    double fac_pl = boost::math::factorial<double>(p_ + std::abs(l_));
    return std::sqrt(2.0 * fac_p / (PI * fac_pl)) / w0_;
  }

  Complex cal_wf(double x, double y) {
    double r = std::sqrt(x * x + y * y);
    double phi = std::atan2(y, x);

    double rho = r * sqrt2_over_w0_;
    double rho_sq = rho * rho;

    double lag = boost::math::laguerre(p_, std::abs(l_), rho_sq);
    double amplitude = std::pow(rho, std::abs(l_)) * lag * std::exp(-(r * r) / w0_sq_);
    Complex phase = std::polar(1.0, -l_ * phi);
    return Complex(amplitude, 0.0) * phase;
  }

  void broadcast(ComplexVector& V, double weight, double nx, double ny,
                 int res_x, int res_y, double pixel_size) {
    double area_x = res_x * pixel_size;
    double area_y = res_y * pixel_size;

    ComplexVector kx(res_x);
    for (int x = 0; x < res_x; ++x) {
      double x_um = (x - res_x / 2.0) * pixel_size;
      kx[x] = std::polar(1.0, TAU * (x_um / area_x) * nx);
    }

    ComplexVector ky(res_y);
    for (int y = 0; y < res_y; ++y) {
      double y_um = -(y - res_y / 2.0) * pixel_size;
      ky[y] = std::polar(1.0, TAU * (y_um / area_y) * ny);
    }

#ifdef _OPENMP
#pragma omp parallel for
#endif
    for (int y = 0; y < res_y; ++y) {
      double y_um = -(y - res_y / 2.0) * pixel_size;
      for (int x = 0; x < res_x; ++x) {
        double x_um = (x - res_x / 2.0) * pixel_size;
        Complex wf = cal_wf(x_um + sx_, y_um + sy_);
        V[y * res_x + x] += norm_ * weight * wf * kx[x] * ky[y];
      }
    }
  }
};