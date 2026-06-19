#include <algorithm>
#include <cmath>

template <const double (&data)[801]>
double fx(double x) {
  double pos = x * 800.0;
  int i = std::clamp(int(pos), 0, 799);
  double t = pos - double(i);
  return std::lerp(data[i], data[i + 1], t);
}