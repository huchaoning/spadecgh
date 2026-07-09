#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <json.hpp>
#include <string>

#include "core.hpp"

using namespace emscripten;

val cal(std::string json_str) {
  auto j = nlohmann::json::parse(json_str);
  int res_x = j["global"]["resolution"][0];
  int res_y = j["global"]["resolution"][1];
  size_t total_pixels = size_t(res_x) * size_t(res_y);

  static std::vector<uint8_t> out_buffer;
  out_buffer.resize(total_pixels);

  core(json_str.c_str(), out_buffer.data());

  return val(typed_memory_view(out_buffer.size(), out_buffer.data()));
}

EMSCRIPTEN_BINDINGS(spadecgh_backend_web) { function("cal", &cal); }