#pragma once

#include <algorithm>
#include <cmath>

template <const uint16_t (&data)[801]>
double fx(double x) {
  double pos = x * 800.0;
  int i = std::clamp(int(pos), 0, 799);
  double t = pos - double(i);

  double v1 = double(data[i]) * 1e-4;
  double v2 = double(data[i + 1]) * 1e-4;

  return std::lerp(v1, v2, t);
}

template <const uint16_t (&matrix)[101][801]>
double fx2d(double x, double zeta) {
  int zeta_idx = int(zeta * 100.0);
  double pos = x * 800.0;

  int i = std::clamp(int(pos), 0, 799);
  double t = pos - double(i);

  double v1 = double(matrix[zeta_idx][i]) * 1e-4;
  double v2 = double(matrix[zeta_idx][i + 1]) * 1e-4;

  return std::lerp(v1, v2, t);
}