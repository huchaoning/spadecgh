#include "core.hpp"

#ifdef _WIN32
#define API_EXPORT __declspec(dllexport)
#else
#define API_EXPORT
#endif

extern "C" {
API_EXPORT int cal(const char* json_str, uint8_t* out_buffer) {
  return core(json_str, out_buffer);
}
}