#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <string>

#include "core.hpp"

using namespace emscripten;

val cal(std::string json_str) {
  auto j = nlohmann::json::parse(json_str);
  int res_x = j["global"]["resolution"][0];
  int res_y = j["global"]["resolution"][1];
  size_t total_pixels = static_cast<size_t>(res_x) * res_y;

  static std::vector<uint8_t> out_buffer;
  out_buffer.resize(total_pixels);

  core(json_str.c_str(), out_buffer.data());

  return val(typed_memory_view(out_buffer.size(), out_buffer.data()));
}

EMSCRIPTEN_BINDINGS(cgh_engine) { function("cal", &cal); }